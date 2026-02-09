import { forwardRef, useState, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PerformanceCard } from './PerformanceCard';
import { AddPerformanceModal } from './AddPerformanceModal';
import type { PerformanceWithTime } from '../types';
import { calculateTimes, checkWarnings, autoSortPerformances } from '../utils/timeCalculation';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';
import { Plus, Sparkles } from 'lucide-react';

interface SortableItemProps {
    performance: PerformanceWithTime;
    members: { id: string; name: string }[];
    onClick?: () => void;
}

function SortableItem({ performance, members, onClick }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: performance.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <PerformanceCard performance={performance} members={members} onClick={onClick} />
        </div>
    );
}

export const TimetableScreen = forwardRef<HTMLDivElement>((_, ref) => {
    const event = useCurrentEvent();
    const { reorderPerformances } = useAppStore();
    const [showAddModal, setShowAddModal] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const performancesWithWarnings = useMemo(() => {
        if (!event) return [];
        const withTime = calculateTimes(event.performances);
        return checkWarnings(withTime, event.members, event.interval);
    }, [event]);

    const warningCount = useMemo(() => {
        return performancesWithWarnings.filter((p) => p.warnings.length > 0).length;
    }, [performancesWithWarnings]);

    // Group performances by block for display - Removed unused code

    if (!event) return null;

    const handleDragEnd = (dragEvent: DragEndEvent) => {
        const { active, over } = dragEvent;

        if (over && active.id !== over.id) {
            const oldIndex = performancesWithWarnings.findIndex((p) => p.id === active.id);
            const newIndex = performancesWithWarnings.findIndex((p) => p.id === over.id);

            const reordered = arrayMove(performancesWithWarnings, oldIndex, newIndex);
            reorderPerformances(event.id, reordered.map((p) => p.id));
        }
    };

    const handleAutoSort = () => {
        const sortedIds = autoSortPerformances(event.performances, event.blocks, event.interval);
        reorderPerformances(event.id, sortedIds);
    };

    if (performancesWithWarnings.length === 0) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p>タイムテーブルが空です</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        「チーム登録」タブからチームを追加してください
                    </p>
                </div>
            </div>
        );
    }

    const totalDuration = performancesWithWarnings.reduce((sum, p) => sum + p.duration, 0);
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;

    return (
        <div className="container" ref={ref}>
            {/* Status header */}
            <div className="section">
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>
                            {performancesWithWarnings.length}チーム
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            合計 {hours > 0 ? `${hours}時間` : ''}{minutes}分
                        </div>
                    </div>
                    <div className="flex items-center gap-sm">
                        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                            {warningCount > 0 && (
                                <button
                                    className="btn btn-rich btn-rich-warning"
                                    style={{ fontSize: '0.875rem', padding: '8px 16px', whiteSpace: 'nowrap' }}
                                    onClick={handleAutoSort}
                                >
                                    <Sparkles size={16} style={{ marginRight: '6px' }} />
                                    自動で配置を調整
                                </button>
                            )}
                            <button
                                className="btn btn-rich btn-rich-primary"
                                style={{ fontSize: '0.875rem', padding: '8px 16px', whiteSpace: 'nowrap' }}
                                onClick={() => setShowAddModal(true)}
                            >
                                <Plus size={16} />
                                演目を追加
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    {warningCount > 0 ? (
                        <span className="status-badge warning">⚠️ 要注意: {warningCount}件</span>
                    ) : (
                        <span className="status-badge ok">✨ 全員OK!</span>
                    )}
                </div>
            </div>

            {/* Timetable list */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                    items={performancesWithWarnings.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {performancesWithWarnings.map((perf) => (
                        <div key={perf.id}>
                            {/* Time marker */}
                            <div className="time-marker">
                                {formatTime(perf.startTime)}
                            </div>
                            <SortableItem
                                performance={perf}
                                members={event.members}
                            />
                        </div>
                    ))}
                    {/* End time marker */}
                    {performancesWithWarnings.length > 0 && (
                        <div className="time-marker">
                            {formatTime(performancesWithWarnings[performancesWithWarnings.length - 1].endTime)}
                            <span style={{ marginLeft: '8px', fontWeight: 500 }}>終了</span>
                        </div>
                    )}
                </SortableContext>
            </DndContext>

            {showAddModal && (
                <AddPerformanceModal onClose={() => setShowAddModal(false)} />
            )}
        </div>
    );
});

TimetableScreen.displayName = 'TimetableScreen';

function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}
