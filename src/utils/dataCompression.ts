import pako from 'pako';
import { v4 as uuidv4 } from 'uuid';
import type { Event, Performance, Member, Block } from '../types';

// Optimized types for minification
// m: names only. Re-generate IDs on import.
// b: names only.
// p: [type, title, duration, memberIndices, preferredBlockIndex]
interface MinifiedEvent {
    n: string; // name
    i: number; // interval
    m: string[]; // member names
    p: [number, string, number, number[], number][]; // performances
    b: string[]; // block names
}

const TYPE_MAP: { [key: string]: number } = {
    'team': 0,
    'break': 1,
};

const TYPE_MAP_REV: { [key: number]: 'team' | 'break' } = {
    0: 'team',
    1: 'break',
};

export function compressEventData(event: Event): string {
    // Map members to indices
    const memberIdMap = new Map<string, number>();
    const memberNames = event.members.map((m, i) => {
        memberIdMap.set(m.id, i);
        return m.name;
    });

    // Map blocks to indices
    const blockIdMap = new Map<string, number>();
    const blockNames = event.blocks.map((b, i) => {
        blockIdMap.set(b.id, i);
        return b.name;
    });

    const minified: MinifiedEvent = {
        n: event.name,
        i: event.interval,
        m: memberNames,
        b: blockNames,
        p: event.performances.map(perf => [
            TYPE_MAP[perf.type] ?? 0,
            perf.title,
            perf.duration,
            perf.memberIds.map(id => memberIdMap.get(id) ?? -1).filter(idx => idx !== -1),
            perf.preferredBlock ? (blockIdMap.get(perf.preferredBlock) ?? -1) : -1
        ])
    };

    const jsonString = JSON.stringify(minified);
    const compressed = pako.deflate(jsonString); // Default compression level

    // Uint8Array to Binary String
    let binary = '';
    const len = compressed.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressed[i]);
    }

    // Binary String to Base64
    return btoa(binary);
}

export function decompressEventData(base64: string): Partial<Event> | null {
    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const decompressed = pako.inflate(bytes, { to: 'string' });
        const minified: MinifiedEvent = JSON.parse(decompressed);

        // Reconstruct Members (New IDs)
        const members: Member[] = minified.m.map(name => ({
            id: uuidv4(),
            name
        }));

        // Reconstruct Blocks (New IDs)
        const blocks: Block[] = minified.b.map((name, index) => ({
            id: uuidv4(),
            name,
            order: index
        }));

        // Reconstruct Performances
        const performances: Performance[] = minified.p.map(([typeCode, title, duration, memberIndices, blockIndex], index) => {
            // Map indices back to new IDs
            const memberIds = memberIndices.map(idx => members[idx]?.id).filter(id => !!id);
            const preferredBlock = (blockIndex >= 0 && blocks[blockIndex]) ? blocks[blockIndex].id : '';

            return {
                id: uuidv4(),
                type: TYPE_MAP_REV[typeCode] || 'team',
                title,
                duration,
                memberIds,
                preferredBlock,
                order: index
            };
        });

        return {
            id: uuidv4(),
            name: minified.n,
            interval: minified.i,
            members,
            performances,
            blocks,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

    } catch (error) {
        console.error('Decompression failed:', error);
        return null;
    }
}
