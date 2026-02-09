import { useMemo } from 'react';
import { X, AlertTriangle, User } from 'lucide-react';
import { useCurrentEvent } from '../store/useAppStore';
import { calculateTimes, checkWarnings } from '../utils/timeCalculation';

interface WarningListModalProps {
    onClose: () => void;
}

export function WarningListModal({ onClose }: WarningListModalProps) {
    const event = useCurrentEvent();

    const warningsData = useMemo(() => {
        if (!event) return { total: 0, byMember: [] };

        const performancesWithTime = calculateTimes(event.performances);
        const performancesWithWarnings = checkWarnings(performancesWithTime, event.members, event.interval);

        // Group warnings by member
        const memberWarnings: Record<string, { memberName: string; performances: { title: string; gap: number }[] }> = {};

        performancesWithWarnings.forEach(perf => {
            perf.warnings.forEach(warning => {
                if (!memberWarnings[warning.memberId]) {
                    memberWarnings[warning.memberId] = {
                        memberName: warning.memberName,
                        performances: [],
                    };
                }
                memberWarnings[warning.memberId].performances.push({
                    title: perf.title || '無題',
                    gap: warning.gap,
                });
            });
        });

        const byMember = Object.values(memberWarnings).sort((a, b) =>
            b.performances.length - a.performances.length
        );

        const total = byMember.reduce((sum, m) => sum + m.performances.length, 0);

        return { total, byMember };
    }, [event]);

    if (!event) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">要注意リスト</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {warningsData.total === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>✨</div>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            すべてのメンバーが十分な休憩時間を確保できています！
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
                            <span style={{ fontWeight: 600 }}>
                                {warningsData.total}件の警告があります
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {warningsData.byMember.map((member, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        backgroundColor: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        marginBottom: 'var(--spacing-sm)',
                                        fontWeight: 600,
                                    }}>
                                        <User size={18} style={{ color: 'var(--color-primary)' }} />
                                        {member.memberName}
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            backgroundColor: 'var(--color-warning)',
                                            color: 'white',
                                            borderRadius: 'var(--radius-full)',
                                        }}>
                                            {member.performances.length}件
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-secondary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--spacing-xs)',
                                    }}>
                                        {member.performances.map((perf, pIndex) => (
                                            <div key={pIndex}>
                                                「{perf.title}」前 - 休憩{perf.gap}分
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={onClose}>
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
