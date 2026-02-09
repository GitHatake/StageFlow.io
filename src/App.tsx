import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
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
      const canvas = await html2canvas(timetableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${event.name}_タイムテーブル.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
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
