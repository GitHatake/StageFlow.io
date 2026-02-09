import { useRef, useState } from 'react';
import { X, Image as ImageIcon, Share2, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';
import { getExportFilename } from '../utils/timeCalculation';

interface ShareModalProps {
    onClose: () => void;
    onExportImage: () => void;
    isExportingImage: boolean;
}

export function ShareModal({ onClose, onExportImage, isExportingImage }: ShareModalProps) {
    const event = useCurrentEvent();
    const { exportTimetableData, importTimetableData } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const handleExportData = () => {
        if (!event) return;
        const data = exportTimetableData(event.id);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = getExportFilename(event.name);
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !event) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const success = importTimetableData(event.id, content);
                if (success) {
                    setImportStatus('success');
                    setStatusMessage('データを読み込みました！');
                    // Optional: Close modal after success? Keep open for confirmation.
                } else {
                    setImportStatus('error');
                    setStatusMessage('データの形式が違います');
                }
            } catch {
                setImportStatus('error');
                setStatusMessage('読み込みに失敗しました');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">共有・保存</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="form-group">
                    {/* Image Share Section */}
                    <div style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-md)',
                        border: '1px solid var(--color-border)',
                    }}>
                        <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
                            <ImageIcon size={24} style={{ color: '#ec4899' }} /> {/* Pink for Image */}
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>画像で送る</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                            タイムテーブルを画像として保存します。<br />
                            LINEやSNSでメンバーに送るのに便利です。
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={onExportImage}
                            disabled={isExportingImage}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '1rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <ImageIcon size={20} />
                            {isExportingImage ? '画像を作成中...' : '画像を保存する'}
                        </button>
                    </div>

                    {/* Data Share Section */}
                    <div style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                    }}>
                        <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
                            <Share2 size={24} style={{ color: '#3b82f6' }} /> {/* Blue for Share */}
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>データ共有（編集用）</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                            編集データをファイルとしてやり取りします。<br />
                            別のスマホやPCで編集の続きができます。
                        </p>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {/* Export */}
                            <button
                                className="btn btn-secondary"
                                onClick={handleExportData}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FileText size={20} />
                                データをファイルに保存
                            </button>

                            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                または
                            </div>

                            {/* Import */}
                            <button
                                className="btn btn-secondary"
                                onClick={handleImportClick}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Upload size={20} />
                                ファイルを読み込む
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                style={{ display: 'none' }}
                            />
                        </div>

                        {importStatus !== 'idle' && (
                            <div style={{
                                marginTop: '12px',
                                padding: '12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: importStatus === 'success' ? '#dcfce7' : '#fee2e2',
                                color: importStatus === 'success' ? '#166534' : '#991b1b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 500
                            }}>
                                {importStatus === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                                {statusMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
