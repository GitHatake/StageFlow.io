import { useState, useMemo } from 'react';
import { useCurrentEvent, useAppStore } from '../store/useAppStore';
import { calculateTimes } from '../utils/timeCalculation';
import { Plus, Edit2, Trash2, Check, UserCog } from 'lucide-react';
import type { MemberTimeline } from '../types';

export function MemberTimelineScreen() {
    const event = useCurrentEvent();
    const { addMembers, updateMember, deleteMember } = useAppStore();

    // Member Management State
    const [isManageMode, setIsManageMode] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingMemberName, setEditingMemberName] = useState('');

    const handleAddMember = () => {
        if (event && newMemberName.trim()) {
            addMembers(event.id, [newMemberName.trim()]);
            setNewMemberName('');
        }
    };

    const handleStartEdit = (memberId: string, name: string) => {
        setEditingMemberId(memberId);
        setEditingMemberName(name);
    };

    const handleSaveEdit = () => {
        if (event && editingMemberId && editingMemberName.trim()) {
            updateMember(event.id, editingMemberId, editingMemberName.trim());
        }
        setEditingMemberId(null);
        setEditingMemberName('');
    };

    const handleDeleteMember = (memberId: string) => {
        if (event && window.confirm('このメンバーを削除しますか？\n（関連するチームからも削除されます）')) {
            deleteMember(event.id, memberId);
        }
    };

    const memberTimelines = useMemo(() => {
        if (!event || event.performances.length === 0) return [];

        const performancesWithTime = calculateTimes(event.performances);
        const timelines: MemberTimeline[] = [];

        // Build timeline for each member
        for (const member of event.members) {
            const appearances = performancesWithTime
                .filter(p => p.memberIds.includes(member.id))
                .map((perf, index, arr) => {
                    const prevEnd = index > 0 ? arr[index - 1].endTime : 0;
                    return {
                        performanceId: perf.id,
                        performanceTitle: perf.title,
                        startTime: perf.startTime,
                        endTime: perf.endTime,
                        restBefore: perf.startTime - prevEnd,
                    };
                });

            timelines.push({
                memberId: member.id,
                memberName: member.name,
                appearances,
                totalAppearances: appearances.length,
            });
        }

        // Sort by appearance count (descending)
        return timelines.sort((a, b) => b.totalAppearances - a.totalAppearances);
    }, [event]);

    if (!event) return null;

    const totalDuration = event.performances.reduce((sum, p) => sum + p.duration, 0);

    if (memberTimelines.length === 0) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <p>メンバー情報がありません</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        チームにメンバーを割り当ててください
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="section">
                <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>メンバー出演状況</div>
                    <button
                        className={`btn btn-rich ${isManageMode ? 'btn-rich-primary' : 'btn-rich-secondary'}`}
                        onClick={() => setIsManageMode(!isManageMode)}
                        style={{ padding: '8px 16px' }}
                    >
                        <UserCog size={18} style={{ marginRight: '6px' }} />
                        {isManageMode ? '編集を完了' : 'メンバー編集モード'}
                    </button>
                </div>
                {!isManageMode && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        出演回数が多い順に表示（必要休憩: {event.interval}分）
                    </p>
                )}

                {/* Add Member Input (Visible in Manage Mode) */}
                {isManageMode && (
                    <div className="flex gap-sm" style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="新しいメンバーを追加"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleAddMember}
                            disabled={!newMemberName.trim()}
                        >
                            <Plus size={16} />
                            追加
                        </button>
                    </div>
                )}
            </div>

            {memberTimelines.map((timeline) => (
                <div key={timeline.memberId} className="member-timeline">
                    <div className="member-timeline-header">
                        {isManageMode && editingMemberId === timeline.memberId ? (
                            <div className="flex gap-sm" style={{ flex: 1, marginRight: '8px' }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={editingMemberName}
                                    onChange={(e) => setEditingMemberName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ padding: '4px 8px', height: '32px' }}
                                />
                                <button className="btn btn-icon btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}>
                                    <Check size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-sm">
                                <span className="member-timeline-name">{timeline.memberName}</span>
                                {isManageMode && (
                                    <>
                                        <button
                                            className="btn btn-icon btn-secondary btn-sm"
                                            onClick={(e) => { e.stopPropagation(); handleStartEdit(timeline.memberId, timeline.memberName); }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="btn btn-icon btn-secondary btn-sm"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteMember(timeline.memberId); }}
                                            style={{ color: 'var(--color-warning)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        <span className="member-timeline-count">
                            {timeline.totalAppearances}回出演
                        </span>
                    </div>

                    {/* Visual timeline bar */}
                    <div className="member-timeline-bar">
                        {timeline.appearances.map((app, index) => {
                            // Calculate segment widths
                            const prevEnd = index > 0 ? timeline.appearances[index - 1].endTime : 0;
                            const restWidth = totalDuration > 0
                                ? ((app.startTime - prevEnd) / totalDuration) * 100
                                : 0;
                            const activeWidth = totalDuration > 0
                                ? ((app.endTime - app.startTime) / totalDuration) * 100
                                : 0;

                            const isWarning = app.restBefore < event.interval && index > 0;

                            return (
                                <div key={app.performanceId} style={{ display: 'contents' }}>
                                    {/* Rest segment */}
                                    {restWidth > 0 && (
                                        <div
                                            className={`member-timeline-segment rest ${isWarning ? 'warning' : ''}`}
                                            style={{ width: `${restWidth}%` }}
                                            title={`休憩 ${app.restBefore}分`}
                                        >
                                            {restWidth > 8 && `${app.restBefore}m`}
                                        </div>
                                    )}
                                    {/* Active segment */}
                                    <div
                                        className="member-timeline-segment active"
                                        style={{ width: `${activeWidth}%` }}
                                        title={app.performanceTitle}
                                    >
                                        {activeWidth > 10 && app.performanceTitle.slice(0, 6)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Details */}
                    <div className="member-timeline-details">
                        {timeline.appearances.map((app, index) => {
                            const isWarning = app.restBefore < event.interval && index > 0;
                            return (
                                <div
                                    key={app.performanceId}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '4px 0',
                                        borderBottom: index < timeline.appearances.length - 1 ? '1px solid var(--color-border)' : 'none'
                                    }}
                                >
                                    <span>
                                        {formatTime(app.startTime)} - {formatTime(app.endTime)}: {app.performanceTitle}
                                    </span>
                                    {index > 0 && (
                                        <span style={{
                                            color: isWarning ? 'var(--color-warning)' : 'inherit',
                                            fontWeight: isWarning ? 600 : 400
                                        }}>
                                            {isWarning && '⚠️ '}休憩{app.restBefore}分
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}
