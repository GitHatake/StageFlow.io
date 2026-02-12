import { useRef, useState } from 'react';
import { X, Image as ImageIcon, Share2, Upload, FileText, Check, AlertCircle, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';
import { useAppStore, useCurrentEvent } from '../store/useAppStore';
import { getExportFilename } from '../utils/timeCalculation';
import { decompressEventData } from '../utils/dataCompression';

interface ShareModalProps {
    onClose: () => void;
    onExportImage: () => void;
    isExportingImage: boolean;
}

export function ShareModal({ onClose, onExportImage, isExportingImage }: ShareModalProps) {
    const event = useCurrentEvent();
    const { exportTimetableData, importTimetableData } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
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

    const handleImageImportClick = () => {
        imageInputRef.current?.click();
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
        e.target.value = '';
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !event) return;

        setImportStatus('idle');
        setStatusMessage('画像を解析中...');

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    try {
                        // Attempt to decompress data from QR code
                        const restoredEvent = decompressEventData(code.data);
                        if (restoredEvent) {
                            // Valid data found! Now import it.
                            // Since importTimetableData expects a specific format or string, 
                            // we might need to serialize it back to JSON string or adapt importTimetableData.
                            // importTimetableData takes a JSON string of { members, performances, blocks }.
                            // decompressEventData returns a Partial<Event> object.

                            // Let's verify structure compatibility.
                            // importTimetableData handles: members, performances, blocks.
                            // restoredEvent has these.

                            const importData = {
                                members: restoredEvent.members,
                                performances: restoredEvent.performances,
                                blocks: restoredEvent.blocks,
                            };

                            const success = importTimetableData(event.id, JSON.stringify(importData));

                            if (success) {
                                setImportStatus('success');
                                setStatusMessage('QRコードから復元しました！');
                            } else {
                                setImportStatus('error');
                                setStatusMessage('データの形式が合いませんでした');
                            }
                        } else {
                            setImportStatus('error');
                            setStatusMessage('QRコードのデータが無効です');
                        }
                    } catch (err) {
                        console.error(err);
                        setImportStatus('error');
                        setStatusMessage('データの読み込みに失敗しました');
                    }
                } else {
                    setImportStatus('error');
                    setStatusMessage('QRコードが見つかりませんでした');
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
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
                            <ImageIcon size={24} style={{ color: '#ec4899' }} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>画像で送る</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                            タイムテーブルを画像として保存します。<br />
                            LINEやSNSでメンバーに送るのに便利です。
                        </p>
                        <div style={{ display: 'grid', gap: '8px' }}>
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

                            <button
                                className="btn btn-secondary"
                                onClick={handleImageImportClick}
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
                                <ScanLine size={20} />
                                画像から復元する
                            </button>
                            <input
                                type="file"
                                ref={imageInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Data Share Section */}
                    <div style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                    }}>
                        <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
                            <Share2 size={24} style={{ color: '#3b82f6' }} />
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
