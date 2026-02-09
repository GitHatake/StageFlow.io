import { useState, useEffect } from 'react';
import { X, Coffee, Music, Trash2 } from 'lucide-react';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';
import type { Performance } from '../types';

interface EditPerformanceModalProps {
    performance: Performance;
    onClose: () => void;
}

export function EditPerformanceModal({ performance, onClose }: EditPerformanceModalProps) {
    const event = useCurrentEvent();
    const { updatePerformance, deletePerformance } = useAppStore();

    const [type, setType] = useState<'team' | 'break'>(performance.type);
    const [title, setTitle] = useState(performance.title);
    const [duration, setDuration] = useState(performance.duration);
    const [selectedMembers, setSelectedMembers] = useState<string[]>(performance.memberIds);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setType(performance.type);
        setTitle(performance.title);
        setDuration(performance.duration);
        setSelectedMembers(performance.memberIds);
    }, [performance]);

    if (!event) return null;

    const handleSave = () => {
        updatePerformance(event.id, performance.id, {
            type,
            title: title || (type === 'break' ? '休憩・MC' : '新規チーム'),
            duration,
            memberIds: selectedMembers,
        });
        onClose();
    };

    const handleDelete = () => {
        deletePerformance(event.id, performance.id);
        onClose();
    };

    const toggleMember = (memberId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">チームを編集</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Type selector */}
                <div className="form-group">
                    <label className="form-label">種類</label>
                    <div className="flex gap-sm">
                        <button
                            className={`interval-option ${type === 'team' ? 'selected' : ''}`}
                            onClick={() => setType('team')}
                            style={{ flex: 1, padding: 'var(--spacing-md)' }}
                        >
                            <Music size={24} style={{ color: 'var(--color-primary)', marginBottom: '0.25rem' }} />
                            <div style={{ fontSize: '0.875rem' }}>チーム</div>
                        </button>
                        <button
                            className={`interval-option ${type === 'break' ? 'selected' : ''}`}
                            onClick={() => setType('break')}
                            style={{ flex: 1, padding: 'var(--spacing-md)' }}
                        >
                            <Coffee size={24} style={{ color: 'var(--color-break)', marginBottom: '0.25rem' }} />
                            <div style={{ fontSize: '0.875rem' }}>休憩・MC</div>
                        </button>
                    </div>
                </div>

                {/* Title */}
                <div className="form-group">
                    <label className="form-label">タイトル</label>
                    <input
                        type="text"
                        className="input"
                        placeholder={type === 'break' ? '休憩・MC' : 'チーム名'}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Duration */}
                <div className="form-group">
                    <label className="form-label">所要時間</label>
                    <div className="flex items-center gap-sm">
                        <input
                            type="number"
                            className="input"
                            value={duration}
                            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            style={{ width: '100px' }}
                        />
                        <span>分</span>
                    </div>
                </div>

                {/* Members */}
                <div className="form-group">
                    <label className="form-label">
                        メンバー
                        {type === 'break' && (
                            <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>（任意）</span>
                        )}
                    </label>
                    {event.members.length === 0 ? (
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            メンバーが登録されていません
                        </p>
                    ) : (
                        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                            {event.members.map((member) => (
                                <span
                                    key={member.id}
                                    className={`tag ${selectedMembers.includes(member.id) ? 'tag-active' : 'tag-inactive'}`}
                                    onClick={() => toggleMember(member.id)}
                                >
                                    {member.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-sm" style={{ marginTop: 'var(--spacing-lg)' }}>
                    {!showDeleteConfirm ? (
                        <>
                            <button
                                className="btn btn-secondary"
                                style={{ padding: 'var(--spacing-md)' }}
                                onClick={() => setShowDeleteConfirm(true)}
                                title="削除"
                            >
                                <Trash2 size={20} style={{ color: 'var(--color-warning)' }} />
                            </button>
                            <button
                                className="btn btn-primary btn-lg"
                                style={{ flex: 1 }}
                                onClick={handleSave}
                            >
                                保存する
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn-secondary btn-lg"
                                style={{ flex: 1 }}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                キャンセル
                            </button>
                            <button
                                className="btn btn-lg"
                                style={{ flex: 1, backgroundColor: 'var(--color-warning)', color: 'white' }}
                                onClick={handleDelete}
                            >
                                削除する
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
