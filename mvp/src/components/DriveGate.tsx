import { useEffect, useState } from 'react';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { useAppStore } from '../store/useAppStore';

/**
 * Gate component: ensures Drive is connected, folder exists, and template is loaded.
 * Only then does it proceed to mode selection.
 */
export function DriveGate() {
  const drive = useGoogleDrive();
  const { setView, setCatalog } = useAppStore();
  const [step, setStep] = useState<'auth' | 'folder' | 'template' | 'ready'>('auth');
  const [error, setError] = useState<string | null>(null);

  // After sign-in, automatically proceed through gates
  useEffect(() => {
    if (!drive.isSignedIn) {
      setStep('auth');
      return;
    }

    const runGates = async () => {
      // Step 1: Find shared folder
      setStep('folder');
      setError(null);
      const found = await drive.checkFolder();
      if (!found) {
        setError('לא נמצאה תיקייה משותפת בשם "ammunition-report" ב-Google Drive שלך. ודא שהתיקייה שותפה איתך.');
        return;
      }

      // Step 2: Load template
      setStep('template');
      const catalog = await drive.loadTemplate();
      if (!catalog) {
        setError(drive.templateError || 'לא נמצא קובץ ammunition-types.csv בתיקייה');
        return;
      }

      // All gates passed
      setCatalog(catalog);
      setStep('ready');
      setView('mode-select');
    };

    runGates();
  }, [drive.isSignedIn]);

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-logo">🎯</div>
        <h1>ספירת מלאי תחמושת</h1>
        <p className="setup-subtitle">מערכת דיווח מלאי</p>
      </div>

      <div className="setup-card">
        {!drive.isConfigured ? (
          <div className="gate-status">
            <p className="gate-error">⚠️ שילוב Google Drive לא מוגדר. יש להגדיר VITE_GOOGLE_CLIENT_ID.</p>
          </div>
        ) : drive.isLoading ? (
          <div className="gate-status">
            <div className="gate-spinner" />
            <p>טוען Google Drive...</p>
          </div>
        ) : step === 'auth' ? (
          <div className="gate-status">
            <p>יש להתחבר ל-Google Drive כדי להמשיך:</p>
            <button className="start-btn" onClick={drive.signIn}>
              🔓 התחבר ל-Google
            </button>
          </div>
        ) : error ? (
          <div className="gate-status">
            <div className="gate-step">
              <span className={step === 'folder' ? 'gate-step-fail' : 'gate-step-ok'}>
                {step === 'folder' ? '✕' : '✓'} תיקייה משותפת
              </span>
              {step === 'template' && (
                <span className="gate-step-fail">✕ קובץ תבנית</span>
              )}
            </div>
            <p className="gate-error">{error}</p>
            <button className="start-btn" onClick={() => {
              setError(null);
              setStep('auth');
              // Re-trigger by re-setting sign-in state — simplest: just retry
              const retry = async () => {
                setStep('folder');
                const found = await drive.checkFolder();
                if (!found) {
                  setError('לא נמצאה תיקייה משותפת בשם "ammunition-report"');
                  return;
                }
                setStep('template');
                const catalog = await drive.loadTemplate();
                if (!catalog) {
                  setError(drive.templateError || 'לא נמצא קובץ ammunition-types.csv');
                  return;
                }
                setCatalog(catalog);
                setView('mode-select');
              };
              retry();
            }}>
              🔄 נסה שוב
            </button>
          </div>
        ) : (
          <div className="gate-status">
            <div className="gate-step">
              <span className={step === 'folder' || step === 'template' || step === 'ready' ? 'gate-step-active' : ''}>
                {step === 'folder' ? '⏳' : '✓'} חיפוש תיקייה...
              </span>
              {(step === 'template' || step === 'ready') && (
                <span className={step === 'template' ? 'gate-step-active' : ''}>
                  {step === 'template' ? '⏳' : '✓'} טעינת תבנית...
                </span>
              )}
            </div>
            <div className="gate-spinner" />
          </div>
        )}

        {drive.isSignedIn && (
          <p className="gate-user-info">
            מחובר כ: <strong>{drive.user?.email}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
