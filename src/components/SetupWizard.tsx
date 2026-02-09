import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parseMemberNames } from '../utils/timeCalculation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { InstallPrompt } from './InstallPrompt';

type Step = 'event' | 'members' | 'interval';

export function SetupWizard() {
    const [step, setStep] = useState<Step>('event');
    const [eventName, setEventName] = useState('');
    const [memberText, setMemberText] = useState('');
    const [interval, setInterval] = useState<number>(10);

    const { createEvent, addMembers, completeSetup, importTimetableData } = useAppStore();

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);

                // Create a temporary event to import into
                // Use imported name/interval if available, otherwise defaults
                const newEventId = createEvent(data.name || 'Imported Event', data.interval || 10);

                const success = importTimetableData(newEventId, json);
                if (success) {
                    completeSetup();
                } else {
                    alert('ファイルの読み込みに失敗しました。形式が正しいか確認してください。');
                }
            } catch (error) {
                console.error('Json parse error:', error);
                alert('ファイルの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    };

    const handleNext = () => {
        if (step === 'event') {
            setStep('members');
        } else if (step === 'members') {
            setStep('interval');
        }
    };

    const handleBack = () => {
        if (step === 'members') {
            setStep('event');
        } else if (step === 'interval') {
            setStep('members');
        }
    };

    const handleComplete = () => {
        const eventId = createEvent(eventName || '新規イベント', interval);
        const names = parseMemberNames(memberText);
        if (names.length > 0) {
            addMembers(eventId, names);
        }
        completeSetup();
    };

    const canProceed = () => {
        if (step === 'event') return eventName.trim().length > 0;
        if (step === 'members') return true; // Optional
        if (step === 'interval') return true;
        return false;
    };

    return (
        <div className="wizard">
            <div className="wizard-content fade-in">
                {step === 'event' && (
                    <>
                        <h1 className="wizard-title">イベント名を入力</h1>
                        <p className="wizard-description">
                            作成するイベントの名前を入力してください
                        </p>
                        <div className="form-group">
                            <input
                                type="text"
                                className="input"
                                placeholder="例：春のダンス発表会"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                または、以前保存したファイルから復元
                            </p>
                            <button
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                                onClick={() => document.getElementById('import-file-input')?.click()}
                            >
                                📂 ファイルから読み込む
                            </button>
                            <input
                                id="import-file-input"
                                type="file"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={handleImportFile}
                            />
                        </div>

                        <InstallPrompt />
                    </>
                )}

                {step === 'members' && (
                    <>
                        <h1 className="wizard-title">メンバーを登録</h1>
                        <p className="wizard-description">
                            LINEやメモ帳から名前リストをコピーして貼り付けてください。
                            改行やカンマで区切られた名前を自動で認識します。
                        </p>
                        <div className="form-group">
                            <textarea
                                className="textarea"
                                placeholder={`田中\n佐藤\n鈴木\n高橋`}
                                value={memberText}
                                onChange={(e) => setMemberText(e.target.value)}
                                rows={8}
                            />
                        </div>
                        {memberText && (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                {parseMemberNames(memberText).length}人のメンバーを認識しました
                            </p>
                        )}
                    </>
                )}

                {step === 'interval' && (
                    <>
                        <h1 className="wizard-title">休憩時間の設定</h1>
                        <p className="wizard-description">
                            同じ人が続けて出る場合、最低何分空けますか？
                        </p>
                        <div className="interval-options">
                            {[5, 10, 15].map((value) => (
                                <button
                                    key={value}
                                    className={`interval-option ${interval === value ? 'selected' : ''}`}
                                    onClick={() => setInterval(value)}
                                >
                                    <div className="interval-option-value">{value}</div>
                                    <div className="interval-option-label">分</div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="wizard-footer">
                <div className="container">
                    {step !== 'event' && (
                        <button className="btn btn-secondary btn-lg" onClick={handleBack}>
                            <ChevronLeft size={20} />
                            戻る
                        </button>
                    )}
                    <button
                        className="btn btn-primary btn-lg"
                        style={{ flex: 1 }}
                        onClick={step === 'interval' ? handleComplete : handleNext}
                        disabled={!canProceed()}
                    >
                        {step === 'interval' ? '完了' : '次へ'}
                        {step !== 'interval' && <ChevronRight size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
