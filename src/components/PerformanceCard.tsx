import { useMemo } from 'react';
import { AlertTriangle, Coffee, Music } from 'lucide-react';
import type { PerformanceWithTime, Member } from '../types';

interface PerformanceCardProps {
    performance: PerformanceWithTime;
    members: Member[];
    isDragging?: boolean;
    onClick?: (e: React.MouseEvent) => void;
}

export function PerformanceCard({ performance, members, isDragging, onClick }: PerformanceCardProps) {
    const memberNames = useMemo(() => {
        return performance.memberIds
            .map((id) => members.find((m) => m.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    }, [performance.memberIds, members]);

    const hasWarning = performance.warnings.length > 0;
    const isBreak = performance.type === 'break';

    const cardClass = `perf-card ${isDragging ? 'dragging' : ''} ${hasWarning ? 'warning' : ''} ${isBreak ? 'break' : ''}`;

    return (
        <div className={cardClass} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
            <div className="perf-card-header">
                <div className="flex items-center gap-sm">
                    {isBreak ? (
                        <Coffee size={18} style={{ color: 'var(--color-break)' }} />
                    ) : (
                        <Music size={18} style={{ color: 'var(--color-primary)' }} />
                    )}
                    <span className="perf-card-title">{performance.title || '無題'}</span>
                </div>
                <span className="perf-card-duration">{performance.duration}分</span>
            </div>

            {memberNames && (
                <div className="perf-card-members">
                    メンバー: {memberNames}
                </div>
            )}

            {hasWarning && (
                <div className="perf-card-warning">
                    <AlertTriangle size={16} />
                    {performance.warnings.map((w) => (
                        <span key={w.memberId}>
                            {w.memberName}（休憩不足 {w.gap}分）
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
