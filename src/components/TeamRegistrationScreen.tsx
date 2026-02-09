import { useState } from 'react';
import { Plus, Trash2, Edit2, Clock, Users, Check, X, Database } from 'lucide-react';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';
import { DataManagementModal } from './DataManagementModal';
import type { Performance } from '../types';

interface TeamFormData {
    title: string;
    duration: number;
    memberIds: string[];
    preferredBlock: string;
}

function TeamAddEditModal({
    onClose,
    editingTeam
}: {
    onClose: () => void;
    editingTeam?: Performance;
}) {
    const event = useCurrentEvent();
    const { addPerformance, updatePerformance } = useAppStore();

    const [formData, setFormData] = useState<TeamFormData>({
        title: editingTeam?.title || '',
        duration: editingTeam?.duration || 5,
        memberIds: editingTeam?.memberIds || [],
        preferredBlock: editingTeam?.preferredBlock || '',
    });

    if (!event) return null;

    const handleToggleMember = (memberId: string) => {
        setFormData(prev => ({
            ...prev,
            memberIds: prev.memberIds.includes(memberId)
                ? prev.memberIds.filter(id => id !== memberId)
                : [...prev.memberIds, memberId]
        }));
    };

    const handleSubmit = () => {
        if (editingTeam) {
            updatePerformance(event.id, editingTeam.id, {
                type: 'team',
                title: formData.title || '新規チーム',
                duration: formData.duration,
                memberIds: formData.memberIds,
                preferredBlock: formData.preferredBlock,
            });
        } else {
            addPerformance(event.id, {
                type: 'team',
                title: formData.title || '新規チーム',
                duration: formData.duration,
                memberIds: formData.memberIds,
                preferredBlock: formData.preferredBlock,
            });
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {editingTeam ? 'チームを編集' : 'チームを追加'}
                    </h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* チーム名 */}
                <div className="form-group">
                    <label className="form-label">チーム名</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="チーム名を入力"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                </div>

                {/* 演目時間 */}
                <div className="form-group">
                    <label className="form-label">演目時間（分）</label>
                    <input
                        type="number"
                        className="input"
                        min={1}
                        max={60}
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            duration: Math.max(1, parseInt(e.target.value) || 5)
                        }))}
                    />
                </div>

                {/* 希望ブロック */}
                <div className="form-group">
                    <label className="form-label">希望ブロック</label>
                    <select
                        className="select"
                        value={formData.preferredBlock}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredBlock: e.target.value }))}
                    >
                        <option value="">指定なし</option>
                        {event.blocks.map((block) => (
                            <option key={block.id} value={block.id}>
                                {block.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* メンバー選択 */}
                <div className="form-group">
                    <label className="form-label">メンバー選択</label>
                    {event.members.length === 0 ? (
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            メンバーが登録されていません
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                            {event.members.map((member) => (
                                <button
                                    key={member.id}
                                    className={`tag ${formData.memberIds.includes(member.id) ? 'tag-active' : 'tag-inactive'}`}
                                    onClick={() => handleToggleMember(member.id)}
                                >
                                    {member.name}
                                    {formData.memberIds.includes(member.id) && (
                                        <Check size={12} style={{ marginLeft: '4px' }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    onClick={handleSubmit}
                >
                    {editingTeam ? '保存' : '追加'}
                </button>
            </div>
        </div>
    );
}

export function TeamRegistrationScreen() {
    const event = useCurrentEvent();
    const { deletePerformance, completeSetup, setCurrentTab } = useAppStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDataModal, setShowDataModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Performance | null>(null);

    if (!event) return null;

    const teams = event.performances.filter(p => p.type === 'team');

    const getBlock = (blockId: string) => {
        if (!blockId) return null;
        return event.blocks.find(b => b.id === blockId) || null;
    };

    // Fixed color palette for blocks
    const BLOCK_COLORS = [
        { bg: '#ffe4e6', text: '#be123c' }, // Rose (A)
        { bg: '#dbeafe', text: '#1e40af' }, // Blue (B)
        { bg: '#dcfce7', text: '#15803d' }, // Green (C)
        { bg: '#fef3c7', text: '#b45309' }, // Amber (D)
        { bg: '#f3e8ff', text: '#7e22ce' }, // Purple (E)
        { bg: '#cffafe', text: '#0e7490' }, // Cyan (F)
        { bg: '#fae8ff', text: '#a21caf' }, // Fuchsia (G)
        { bg: '#ffedd5', text: '#c2410c' }, // Orange (H)
    ];

    const getBlockStyle = (order: number) => {
        const color = BLOCK_COLORS[order % BLOCK_COLORS.length];
        return {
            backgroundColor: color.bg,
            color: color.text,
            border: `1px solid ${color.bg === '#ffffff' ? '#e2e8f0' : 'transparent'}`, // Optional border logic
        };
    };

    const getMemberNames = (memberIds: string[]) => {
        return memberIds
            .map(id => event.members.find(m => m.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    const handleGenerateTimetable = () => {
        completeSetup();
        setCurrentTab('timetable');
    };

    return (
        <div className="container">
            {/* メンバー概要 */}
            <div className="section">
                <div className="section-title">登録済みメンバー</div>
                {event.members.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        設定画面からメンバーを追加してください
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                        {event.members.map((member) => (
                            <span key={member.id} className="tag tag-inactive">
                                {member.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* チーム一覧 */}
            <div className="section">
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>登録チーム ({teams.length})</div>
                    <button
                        className="btn btn-rich btn-rich-secondary"
                        onClick={() => setShowDataModal(true)}
                        style={{ fontSize: '0.875rem', padding: '6px 12px' }}
                    >
                        <Database size={16} style={{ marginRight: '6px' }} />
                        データの保存・読込
                    </button>
                </div>

                {teams.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎭</div>
                        <p>チームがまだ登録されていません</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            下のボタンからチームを追加してください
                        </p>
                    </div>
                ) : (
                    teams.map((team) => (
                        <div key={team.id} className="team-card">
                            <div className="team-card-header">
                                <div className="team-card-title">
                                    {team.title}
                                    {(() => {
                                        const block = getBlock(team.preferredBlock);
                                        if (block) {
                                            return (
                                                <span
                                                    className="team-card-block"
                                                    style={getBlockStyle(block.order)}
                                                >
                                                    {block.name}
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                                <div className="flex gap-sm">
                                    <button
                                        className="btn btn-icon btn-secondary"
                                        onClick={() => setEditingTeam(team)}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn btn-icon btn-secondary"
                                        style={{ color: 'var(--color-warning)' }}
                                        onClick={() => deletePerformance(event.id, team.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="team-card-info">
                                <span><Clock size={14} style={{ verticalAlign: 'middle' }} /> {team.duration}分</span>
                                <span>
                                    <Users size={14} style={{ verticalAlign: 'middle' }} />
                                    {team.memberIds.length > 0
                                        ? getMemberNames(team.memberIds)
                                        : 'メンバー未設定'}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                <button
                    className="btn btn-rich btn-rich-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus size={20} />
                    新しいチームを登録
                </button>
            </div>

            {/* タイムテーブル生成ボタン */}
            {teams.length > 0 && (
                <button
                    className="generate-btn"
                    onClick={handleGenerateTimetable}
                >
                    📅 タイムテーブルを生成
                </button>
            )}

            {/* モーダル */}
            {showAddModal && (
                <TeamAddEditModal onClose={() => setShowAddModal(false)} />
            )}
            {editingTeam && (
                <TeamAddEditModal
                    editingTeam={editingTeam}
                    onClose={() => setEditingTeam(null)}
                />
            )}
            {showDataModal && (
                <DataManagementModal onClose={() => setShowDataModal(false)} />
            )}
        </div>
    );
}
