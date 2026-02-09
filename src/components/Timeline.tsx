import { useMemo } from 'react';
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
import type { Event, PerformanceWithTime } from '../types';
import { calculateTimes, checkWarnings, autoSortPerformances } from '../utils/timeCalculation';
import { useAppStore } from '../store/useAppStore';
import { CalendarCheck, Sparkles } from 'lucide-react';

interface TimelineProps {
    event: Event;
    onPerformanceClick?: (perfId: string) => void;
}

interface SortableItemProps {
    performance: PerformanceWithTime;
    members: Event['members'];
    onCardClick?: () => void;
}

function SortableItem({ performance, members, onCardClick }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: performance.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
        // Only trigger click if not dragging
        if (!isDragging && onCardClick) {
            e.stopPropagation();
            onCardClick();
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div className="time-marker">{performance.startTime}分経過</div>
            <PerformanceCard
                performance={performance}
                members={members}
                isDragging={isDragging}
                onClick={handleClick}
            />
        </div>
    );
}

export function Timeline({ event, onPerformanceClick }: TimelineProps) {
    const { reorderPerformances } = useAppStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const performancesWithWarnings = useMemo(() => {
        const withTimes = calculateTimes(event.performances);
        return checkWarnings(withTimes, event.members, event.interval);
    }, [event.performances, event.members, event.interval]);

    const warningCount = useMemo(() => {
        return performancesWithWarnings.filter((p) => p.warnings.length > 0).length;
    }, [performancesWithWarnings]);

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
            <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>チームがまだありません</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    右下の「＋」ボタンから追加してください
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Status summary */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-md)' }}>
                <div className="flex items-center gap-sm">
                    <CalendarCheck size={20} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 500 }}>{event.performances.length}チーム</span>
                </div>
                <div className="flex items-center gap-sm">
                    {warningCount > 0 && (
                        <button
                            className="btn btn-secondary"
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                            onClick={handleAutoSort}
                            title="自動で並び替え"
                        >
                            <Sparkles size={14} />
                            自動ソート
                        </button>
                    )}
                    {warningCount > 0 ? (
                        <span className="status-badge warning">⚠️ 要注意: {warningCount}件</span>
                    ) : (
                        <span className="status-badge ok">✨ 全員OK!</span>
                    )}
                </div>
            </div>

            {/* Sortable list */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={performancesWithWarnings.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {performancesWithWarnings.map((perf) => (
                        <SortableItem
                            key={perf.id}
                            performance={perf}
                            members={event.members}
                            onCardClick={() => onPerformanceClick?.(perf.id)}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {/* Total time */}
            <div className="time-marker" style={{ marginTop: 'var(--spacing-md)' }}>
                合計: {performancesWithWarnings.reduce((sum, p) => sum + p.duration, 0)}分
            </div>
        </div>
    );
}
