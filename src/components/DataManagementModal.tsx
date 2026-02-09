import { useState, useRef } from 'react';
import { X, Download, Upload, FileJson, Check, AlertCircle } from 'lucide-react';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';
import { getExportFilename } from '../utils/timeCalculation';

interface DataManagementModalProps {
    onClose: () => void;
}

export function DataManagementModal({ onClose }: DataManagementModalProps) {
    const event = useCurrentEvent();
    const { exportTeamsData, importTeamsData } = useAppStore();
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (!event) return;
        const jsonString = exportTeamsData(event.id);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getExportFilename(event.name, '_teams');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !event) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const success = importTeamsData(useAppStore.getState().currentEventId!, json);
                if (success) {
                    setImportStatus('success');
                    setStatusMessage('チームデータのインポートに成功しました');
                } else {
                    setImportStatus('error');
                    setStatusMessage('データの形式が正しくありません');
                }
            } catch {
                setImportStatus('error');
                setStatusMessage('ファイルの読み込みに失敗しました');
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
                    <h2 className="modal-title">チームデータの保存・読込</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="form-group">
                    <p className="wizard-description" style={{ marginBottom: 'var(--spacing-md)' }}>
                        チームデータ（チーム情報、メンバー、ブロック設定）をJSONファイルとして保存・復元できます。
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {/* Export Section */}
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                        }}>
                            <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
                                <Download size={20} style={{ color: 'var(--color-primary)' }} />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>ファイルを保存</h3>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                                チーム構成をファイルに保存します（バックアップ）。
                            </p>
                            <button className="btn btn-secondary" onClick={handleExport} style={{ width: '100%' }}>
                                <FileJson size={16} style={{ marginRight: '8px' }} />
                                ファイルを保存
                            </button>
                        </div>

                        {/* Import Section */}
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                        }}>
                            <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
                                <Upload size={20} style={{ color: 'var(--color-secondary)' }} />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>ファイルを読み込む</h3>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                                保存したファイルを読み込んで、チームを追加します。
                            </p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                style={{ display: 'none' }}
                            />

                            <button className="btn btn-secondary" onClick={handleImportClick} style={{ width: '100%' }}>
                                <Upload size={16} style={{ marginRight: '8px' }} />
                                ファイルを選択
                            </button>

                            {importStatus !== 'idle' && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: importStatus === 'success' ? '#dcfce7' : '#fee2e2',
                                    color: importStatus === 'success' ? '#166534' : '#991b1b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.875rem'
                                }}>
                                    {importStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                    {statusMessage}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
