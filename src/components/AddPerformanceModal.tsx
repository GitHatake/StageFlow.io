import { useState } from 'react';
import { X, Coffee, Music } from 'lucide-react';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';
import type { Performance } from '../types';

interface AddPerformanceModalProps {
    onClose: () => void;
}

export function AddPerformanceModal({ onClose }: AddPerformanceModalProps) {
    const event = useCurrentEvent();
    const { addPerformance } = useAppStore();

    const [type, setType] = useState<'team' | 'break'>('team');
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(5);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [preferredBlock, setPreferredBlock] = useState('');

    if (!event) return null;

    const handleSubmit = () => {
        const perf: Omit<Performance, 'id' | 'order'> = {
            type,
            title: title || (type === 'break' ? '休憩・MC' : '新規チーム'),
            duration,
            memberIds: selectedMembers,
            preferredBlock: type === 'team' ? preferredBlock : '',
        };
        addPerformance(event.id, perf);
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
                    <h2 className="modal-title">チームを追加</h2>
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

                {/* Preferred Block (team only) */}
                {type === 'team' && (
                    <div className="form-group">
                        <label className="form-label">希望ブロック</label>
                        <select
                            className="select"
                            value={preferredBlock}
                            onChange={(e) => setPreferredBlock(e.target.value)}
                        >
                            <option value="">指定なし</option>
                            {event.blocks.map((block) => (
                                <option key={block.id} value={block.id}>
                                    {block.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Members (show for both types but optional for breaks) */}
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

                {/* Submit */}
                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                    onClick={handleSubmit}
                >
                    追加する
                </button>
            </div>
        </div>
    );
}
