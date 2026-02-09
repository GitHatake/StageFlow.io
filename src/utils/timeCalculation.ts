import type { Performance, Member, Warning, PerformanceWithTime, Block } from '../types';

/**
 * Calculate cumulative start/end times for all performances
 */
export function calculateTimes(performances: Performance[]): PerformanceWithTime[] {
    const sorted = [...performances].sort((a, b) => a.order - b.order);
    let currentTime = 0;

    return sorted.map((perf) => {
        const startTime = currentTime;
        const endTime = currentTime + perf.duration;
        currentTime = endTime;

        return {
            ...perf,
            startTime,
            endTime,
            warnings: [], // Will be populated by checkWarnings
        };
    });
}

/**
 * Check for interval violations (rest time insufficient)
 * Logic: If (T_start_B - T_end_A) < interval, member M is warned on performance B
 */
export function checkWarnings(
    performancesWithTime: PerformanceWithTime[],
    members: Member[],
    interval: number
): PerformanceWithTime[] {
    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    // Build a map: memberId -> list of { performanceId, startTime, endTime }
    const memberPerformances = new Map<string, { perfId: string; start: number; end: number }[]>();

    for (const perf of performancesWithTime) {
        for (const memberId of perf.memberIds) {
            if (!memberPerformances.has(memberId)) {
                memberPerformances.set(memberId, []);
            }
            memberPerformances.get(memberId)!.push({
                perfId: perf.id,
                start: perf.startTime,
                end: perf.endTime,
            });
        }
    }

    // Check each member's consecutive appearances
    const warningsMap = new Map<string, Warning[]>();

    for (const [memberId, appearances] of memberPerformances) {
        // Sort by start time
        appearances.sort((a, b) => a.start - b.start);

        for (let i = 1; i < appearances.length; i++) {
            const prev = appearances[i - 1];
            const curr = appearances[i];
            const gap = curr.start - prev.end;

            if (gap < interval) {
                const warning: Warning = {
                    performanceId: curr.perfId,
                    memberId,
                    memberName: memberMap.get(memberId) || 'Unknown',
                    gap,
                };

                if (!warningsMap.has(curr.perfId)) {
                    warningsMap.set(curr.perfId, []);
                }
                warningsMap.get(curr.perfId)!.push(warning);
            }
        }
    }

    // Attach warnings to performances
    return performancesWithTime.map((perf) => ({
        ...perf,
        warnings: warningsMap.get(perf.id) || [],
    }));
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse member names from text (newline or comma separated)
 */
export function parseMemberNames(text: string): string[] {
    return text
        .split(/[\n,]/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
}

/**
 * Auto-sort performances to minimize interval violations
 * Uses greedy algorithm: for each position, pick the performance
 * that has the least conflict with recently placed members
 */
/**
 * Auto-sort performances to minimize interval violations
 * Respects preferred blocks
 */
export function autoSortPerformances(
    performances: Performance[],
    blocks: Block[],
    interval: number
): string[] {
    if (performances.length <= 1) {
        return performances.map(p => p.id);
    }

    // 1. Group performances by block
    // Sort blocks by order (A -> B -> C...)
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
    const blockIds = new Set(sortedBlocks.map(b => b.id));

    const perfsByBlock = new Map<string, Performance[]>();
    const unassigned: Performance[] = [];

    // Initialize map for sorted blocks
    sortedBlocks.forEach(b => perfsByBlock.set(b.id, []));

    performances.forEach(p => {
        if (p.preferredBlock && blockIds.has(p.preferredBlock)) {
            perfsByBlock.get(p.preferredBlock)!.push(p);
        } else {
            unassigned.push(p);
        }
    });

    // 2. Greedy sort function (optimized for linear execution)
    const solveGreedy = (
        items: Performance[],
        initialTime: number,
        initialMemberLastEnd: Map<string, number>
    ) => {
        if (items.length === 0) return { sorted: [], endTime: initialTime, memberLastEnd: initialMemberLastEnd };

        const remaining = [...items];
        const sorted: Performance[] = [];
        const memberLastEnd = new Map(initialMemberLastEnd);
        let currentTime = initialTime;

        while (remaining.length > 0) {
            let bestIndex = 0;
            let bestScore = -Infinity;

            for (let i = 0; i < remaining.length; i++) {
                const perf = remaining[i];
                let score = 0;
                let violations = 0;

                for (const memberId of perf.memberIds) {
                    const lastEnd = memberLastEnd.get(memberId);
                    if (lastEnd !== undefined) {
                        const gap = currentTime - lastEnd;
                        if (gap < interval) {
                            violations++;
                            score -= (interval - gap) * 2; // Penalize heavy
                        } else {
                            score += Math.min(gap, interval * 2); // Cap reward
                        }
                    } else {
                        score += 50; // Mild bonus for fresh start
                    }
                }

                // Prioritize heavy on avoiding violations
                const finalScore = score - violations * 1000;

                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestIndex = i;
                }
            }

            const chosen = remaining.splice(bestIndex, 1)[0];
            sorted.push(chosen);

            const endTime = currentTime + chosen.duration;
            for (const memberId of chosen.memberIds) {
                memberLastEnd.set(memberId, endTime);
            }
            currentTime = endTime;
        }

        return { sorted, endTime: currentTime, memberLastEnd };
    };

    // 3. Execute sort block by block
    let finalSorted: Performance[] = [];
    let currentTime = 0;
    let memberLastEnd = new Map<string, number>();

    // Process blocks in order
    for (const block of sortedBlocks) {
        const blockPerfs = perfsByBlock.get(block.id)!;
        if (blockPerfs.length > 0) {
            const result = solveGreedy(blockPerfs, currentTime, memberLastEnd);
            finalSorted = [...finalSorted, ...result.sorted];
            currentTime = result.endTime;
            memberLastEnd = result.memberLastEnd;
        }
    }

    // Process unassigned at the end
    if (unassigned.length > 0) {
        const result = solveGreedy(unassigned, currentTime, memberLastEnd);
        finalSorted = [...finalSorted, ...result.sorted];
    }

    return finalSorted.map(p => p.id);
}

/**
 * Count total warnings for a given performance order
 */
export function countWarnings(
    performances: Performance[],
    interval: number
): number {
    const performancesWithTime = calculateTimes(performances);
    let totalWarnings = 0;

    // Build member timeline
    const memberPerformances = new Map<string, { start: number; end: number }[]>();

    for (const perf of performancesWithTime) {
        for (const memberId of perf.memberIds) {
            if (!memberPerformances.has(memberId)) {
                memberPerformances.set(memberId, []);
            }
            memberPerformances.get(memberId)!.push({
                start: perf.startTime,
                end: perf.endTime,
            });
        }
    }

    // Count violations
    for (const appearances of memberPerformances.values()) {
        appearances.sort((a, b) => a.start - b.start);
        for (let i = 1; i < appearances.length; i++) {
            const gap = appearances[i].start - appearances[i - 1].end;
            if (gap < interval) {
                totalWarnings++;
            }
        }
    }

    return totalWarnings;
}

/**
 * Generate standardized export filename
 * Format: StageFlow_{EventName}_{YYYYMMDD_HHmm}{suffix}.json
 */
export function getExportFilename(eventName: string, suffix: string = ''): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    // Sanitize event name (remove special chars)
    const safeName = eventName.replace(/[<>:"/\\|?*]+/g, '-').trim();

    return `StageFlow_${safeName}_${yyyy}${mm}${dd}_${hh}${min}${suffix}.json`;
}
