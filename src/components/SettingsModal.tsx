import { useState } from 'react';
import { X, Users, Clock, Trash2, Plus, Edit2, Check } from 'lucide-react';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';

interface SettingsModalProps {
    onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
    const event = useCurrentEvent();
    const {
        updateEvent,
        addMembers,
        updateMember,
        deleteMember,
        resetSetup,
        addBlock,
        updateBlock,
        deleteBlock
    } = useAppStore();

    const [eventName, setEventName] = useState(event?.name || '');
    const [interval, setInterval] = useState(event?.interval || 15);
    const [newMemberName, setNewMemberName] = useState('');
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingMemberName, setEditingMemberName] = useState('');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Block Management State
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [editingBlockName, setEditingBlockName] = useState('');

    if (!event) return null;

    const handleSaveEventInfo = () => {
        updateEvent(event.id, { name: eventName, interval });
    };

    const handleAddMember = () => {
        if (newMemberName.trim()) {
            addMembers(event.id, [newMemberName.trim()]);
            setNewMemberName('');
        }
    };

    const handleStartEdit = (memberId: string, name: string) => {
        setEditingMemberId(memberId);
        setEditingMemberName(name);
    };

    const handleSaveEdit = () => {
        if (editingMemberId && editingMemberName.trim()) {
            updateMember(event.id, editingMemberId, editingMemberName.trim());
        }
        setEditingMemberId(null);
        setEditingMemberName('');
    };

    const handleDeleteMember = (memberId: string) => {
        deleteMember(event.id, memberId);
    };

    const handleReset = () => {
        resetSetup();
        onClose();
    };

    const handleStartBlockEdit = (blockId: string, name: string) => {
        setEditingBlockId(blockId);
        setEditingBlockName(name);
    };

    const handleSaveBlockEdit = () => {
        if (editingBlockId && editingBlockName.trim()) {
            updateBlock(event.id, editingBlockId, editingBlockName.trim());
        }
        setEditingBlockId(null);
        setEditingBlockName('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'auto' }}>
                <div className="modal-header">
                    <h2 className="modal-title">設定</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Event Name */}
                <div className="form-group">
                    <label className="form-label">イベント名</label>
                    <div className="flex gap-sm">
                        <input
                            type="text"
                            className="input"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveEventInfo}
                            disabled={eventName === event.name && interval === event.interval}
                        >
                            保存
                        </button>
                    </div>
                </div>

                {/* Interval */}
                <div className="form-group">
                    <label className="form-label">
                        <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} />
                        必要な休憩時間
                    </label>
                    <div className="flex items-center gap-sm">
                        <input
                            type="number"
                            className="input"
                            value={interval}
                            onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            style={{ width: '80px' }}
                        />
                        <span>分</span>
                    </div>
                </div>

                {/* Block Management */}
                <div className="form-group">
                    <label className="form-label">
                        <span style={{ marginRight: '4px' }}>🧱</span>
                        ブロック管理
                    </label>

                    {/* Add new block */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => addBlock(event.id)}
                        >
                            <Plus size={16} style={{ marginRight: '4px' }} />
                            ブロックを追加
                        </button>
                    </div>

                    {/* Block list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {event.blocks.map((block) => (
                            <div
                                key={block.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                {editingBlockId === block.id ? (
                                    <>
                                        <input
                                            type="text"
                                            className="input"
                                            value={editingBlockName}
                                            onChange={(e) => setEditingBlockName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSaveBlockEdit()}
                                            autoFocus
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="btn btn-icon btn-primary"
                                            onClick={handleSaveBlockEdit}
                                        >
                                            <Check size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ flex: 1 }}>{block.name}</span>
                                        <button
                                            className="btn btn-icon btn-secondary"
                                            onClick={() => handleStartBlockEdit(block.id, block.name)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn btn-icon btn-secondary"
                                            onClick={() => deleteBlock(event.id, block.id)}
                                            title="削除すると、このブロックに関連付けられたチームの希望ブロック設定は解除されます"
                                        >
                                            <Trash2 size={16} style={{ color: 'var(--color-warning)' }} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Members */}
                <div className="form-group">
                    <label className="form-label">
                        <Users size={16} style={{ display: 'inline', marginRight: '4px' }} />
                        メンバー管理
                    </label>

                    {/* Add new member */}
                    <div className="flex gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="新しいメンバー名"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-primary btn-icon"
                            onClick={handleAddMember}
                            disabled={!newMemberName.trim()}
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Member list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {event.members.map((member) => (
                            <div
                                key={member.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                {editingMemberId === member.id ? (
                                    <>
                                        <input
                                            type="text"
                                            className="input"
                                            value={editingMemberName}
                                            onChange={(e) => setEditingMemberName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            autoFocus
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="btn btn-icon btn-primary"
                                            onClick={handleSaveEdit}
                                        >
                                            <Check size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ flex: 1 }}>{member.name}</span>
                                        <button
                                            className="btn btn-icon btn-secondary"
                                            onClick={() => handleStartEdit(member.id, member.name)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn btn-icon btn-secondary"
                                            onClick={() => handleDeleteMember(member.id)}
                                        >
                                            <Trash2 size={16} style={{ color: 'var(--color-warning)' }} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        {event.members.length === 0 && (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                メンバーが登録されていません
                            </p>
                        )}
                    </div>
                </div>

                {/* Danger Zone */}
                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    paddingTop: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--color-border)',
                }}>
                    <label className="form-label" style={{ color: 'var(--color-warning)' }}>
                        危険な操作
                    </label>
                    {!showResetConfirm ? (
                        <button
                            className="btn btn-secondary"
                            style={{
                                width: '100%',
                                borderColor: 'var(--color-warning)',
                                color: 'var(--color-warning)',
                            }}
                            onClick={() => setShowResetConfirm(true)}
                        >
                            <Trash2 size={18} style={{ marginRight: '8px' }} />
                            すべてのデータをリセット
                        </button>
                    ) : (
                        <div className="flex gap-sm">
                            <button
                                className="btn btn-secondary btn-lg"
                                style={{ flex: 1 }}
                                onClick={() => setShowResetConfirm(false)}
                            >
                                キャンセル
                            </button>
                            <button
                                className="btn btn-lg"
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--color-warning)',
                                    color: 'white',
                                }}
                                onClick={handleReset}
                            >
                                リセット実行
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
