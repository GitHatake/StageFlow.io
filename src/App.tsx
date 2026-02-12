import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { compressEventData } from './utils/dataCompression';
import { useAppStore, useCurrentEvent } from './store/useAppStore';
import { SetupWizard } from './components/SetupWizard';
import { TeamRegistrationScreen } from './components/TeamRegistrationScreen';
import { TimetableScreen } from './components/TimetableScreen';
import { MemberTimelineScreen } from './components/MemberTimelineScreen';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { Users, Calendar, UserCheck, Settings, Share2 } from 'lucide-react';
import './index.css';

function MainApp() {
  const event = useCurrentEvent();
  const { currentTab, setCurrentTab } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const timetableRef = useRef<HTMLDivElement>(null);

  const handleExportImage = useCallback(async () => {
    if (!timetableRef.current || !event) return;

    setIsExporting(true);
    try {
      // 1. Generate QR Code
      const compressedData = compressEventData(event);
      // QR Code URL (App URL + hash or query param? For now just raw data or specific URL schema)
      // Since it's for "Restore", we might want to just encode the data directly or a URL that handles it.
      // For this implementation, let's encode the JSON data directly (compressed) so the app can read it.
      // Prefix with specific protocol or just data?
      // Let's use a simple JSON string (compressed).
      // Note: QR code capacity for binary is limited. 1.7KB is fine for v40 but might be dense.
      // Let's assume the scanner in the app will handle this string.
      const qrDataUrl = await QRCode.toDataURL(compressedData, {
        errorCorrectionLevel: 'Q', // Higher error correction
        margin: 1, // Slight margin to ensure quiet zone
        width: 1024, // Ultra High resolution to prevent aliasing for dense data (~1.7KB)
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // 2. Create Wrapper for Capture
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.top = '-10000px';
      wrapper.style.left = '-10000px';
      wrapper.style.width = '1200px'; // Fixed width for consistent output
      wrapper.style.backgroundColor = '#fff5f7'; // Theme bg
      wrapper.style.color = '#333';
      wrapper.style.fontFamily = '"Zen Maru Gothic", sans-serif';
      document.body.appendChild(wrapper);

      // 3. Create Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.padding = '24px 32px';
      header.style.background = 'linear-gradient(135deg, #fff0f5 0%, #fff 100%)';
      header.style.borderBottom = '1px solid rgba(0,0,0,0.05)';

      // Logo/Title Section
      const titleSection = document.createElement('div');
      titleSection.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="pwa-192x192.png" style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover;" alt="StageFlow Logo" />
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">${event.name}</h1>
            <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">Produced by StageFlow</p>
          </div>
        </div>
      `;

      // QR Section
      const qrSection = document.createElement('div');
      qrSection.style.display = 'flex';
      qrSection.style.alignItems = 'center';
      qrSection.style.gap = '12px';
      qrSection.style.backgroundColor = 'white';
      qrSection.style.padding = '8px';
      qrSection.style.borderRadius = '8px';
      qrSection.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
      qrSection.innerHTML = `
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; font-weight: bold; color: #4b5563;">Scan to Restore</p>
          <p style="margin: 0; font-size: 8px; color: #9ca3af;">データ復元用QR</p>
        </div>
        <img src="${qrDataUrl}" style="width: 100px; height: 100px; display: block;" />
      `;

      header.appendChild(titleSection);
      header.appendChild(qrSection);
      wrapper.appendChild(header);

      // 4. Clone Timetable
      const timetableClone = timetableRef.current.cloneNode(true) as HTMLElement;
      timetableClone.style.padding = '32px';
      // Force width to match wrapper
      timetableClone.style.width = '100%';
      timetableClone.style.boxSizing = 'border-box';
      // Remove any scrollbars or max-heights from the clone if present
      timetableClone.style.height = 'auto';
      timetableClone.style.overflow = 'visible';

      wrapper.appendChild(timetableClone);

      // 5. Capture
      const canvas = await html2canvas(wrapper, {
        backgroundColor: '#fff5f7',
        scale: 4, // Higher resolution (was 2, tried 4? No, try 4 for readability)
        useCORS: true,
        logging: false,
      });

      // 6. Download
      const link = document.createElement('a');
      link.download = `${event.name}_タイムテーブル.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // 7. Cleanup
      document.body.removeChild(wrapper);

    } catch (error) {
      console.error('画像エクスポートエラー:', error);
      alert('画像の保存に失敗しました');
    } finally {
      setIsExporting(false);
    }
  }, [event]);

  if (!event) {
    return (
      <div className="empty-state" style={{ marginTop: '4rem' }}>
        <p>イベントが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 style={{ fontSize: '1.125rem' }}>{event.name}</h1>
          <div className="flex gap-sm">
            {currentTab === 'timetable' && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowShareModal(true)}
                style={{ gap: '6px' }}
              >
                <Share2 size={18} />
                <span style={{ fontSize: '0.875rem' }}>保存・共有</span>
              </button>
            )}
            <button
              className="btn btn-icon btn-secondary"
              title="設定"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main" style={{ paddingBottom: '80px' }}>
        {currentTab === 'teams' && <TeamRegistrationScreen />}
        {currentTab === 'timetable' && <TimetableScreen ref={timetableRef} />}
        {currentTab === 'members' && <MemberTimelineScreen />}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-tab ${currentTab === 'teams' ? 'active' : ''}`}
          onClick={() => setCurrentTab('teams')}
        >
          <Users size={20} />
          <span>チーム登録</span>
        </button>
        <button
          className={`nav-tab ${currentTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setCurrentTab('timetable')}
        >
          <Calendar size={20} />
          <span>タイムテーブル</span>
        </button>
        <button
          className={`nav-tab ${currentTab === 'members' ? 'active' : ''}`}
          onClick={() => setCurrentTab('members')}
        >
          <UserCheck size={20} />
          <span>メンバー確認</span>
        </button>
      </nav>

      {/* Export Loading Overlay */}
      {isExporting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>📸</div>
            <p>画像を生成中...</p>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          onExportImage={handleExportImage}
          isExportingImage={isExporting}
        />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function App() {
  const { isSetupComplete, _hasHydrated } = useAppStore();

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (!isSetupComplete) {
    return <SetupWizard />;
  }

  return <MainApp />;
}

export default App;
