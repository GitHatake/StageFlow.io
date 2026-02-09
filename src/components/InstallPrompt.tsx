import { useState, useEffect } from 'react';
import { Download, Share, HelpCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showIOSHint, setShowIOSHint] = useState(false);

    // Initialize state lazily to avoid effect cascading and ensure window access
    const [isIOS] = useState(() => {
        if (typeof window === 'undefined') return false;
        return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    });

    const [isStandalone] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone ||
            document.referrer.includes('android-app://');
    });

    useEffect(() => {
        // Listen for install prompt (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isStandalone) return null;

    return (
        <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'linear-gradient(to right, #eff6ff, #f5f3ff)',
            borderRadius: '12px',
            border: '1px solid #dbeafe'
        }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: '8px', color: '#1e40af' }}>
                <Download size={20} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>アプリとして使う</h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '12px', lineHeight: '1.5' }}>
                ホーム画面に追加すると、オフラインでも使えて便利です。
            </p>

            {deferredPrompt && (
                <button
                    className="btn btn-primary"
                    onClick={handleInstallClick}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    <Download size={18} style={{ marginRight: '8px' }} />
                    インストールする
                </button>
            )}

            {isIOS && (
                <div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowIOSHint(!showIOSHint)}
                        style={{ width: '100%', justifyContent: 'center', backgroundColor: 'white' }}
                    >
                        <HelpCircle size={18} style={{ marginRight: '8px' }} />
                        インストール方法を見る
                    </button>

                    {showIOSHint && (
                        <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <ol style={{ paddingLeft: '20px', margin: 0 }}>
                                <li style={{ marginBottom: '8px' }}>
                                    画面下部の <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 4px' }} /> <strong>共有ボタン</strong>をタップ
                                </li>
                                <li>
                                    メニューから<strong>「ホーム画面に追加」</strong>を選択
                                </li>
                            </ol>
                        </div>
                    )}
                </div>
            )}

            {!deferredPrompt && !isIOS && (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                    ブラウザのメニューから「アプリをインストール」<br />または「ホーム画面に追加」を選択してください
                </p>
            )}
        </div>
    );
}
