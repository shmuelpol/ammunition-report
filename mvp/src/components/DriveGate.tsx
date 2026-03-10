import { useEffect, useState } from 'react';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { useAppStore } from '../store/useAppStore';

/**
 * Gate: ensures Google sign-in + folder setup.
 * Step 1: Google sign-in (drive.file scope only)
 * Step 2: Folder setup — create / pick / paste ID
 */
export function DriveGate() {
  const drive = useGoogleDrive();
  const { setView } = useAppStore();
  const [step, setStep] = useState<'auth' | 'folder'>('auth');
  const [error, setError] = useState<string | null>(null);
  const [folderIdInput, setFolderIdInput] = useState('');
  const [folderName, setFolderName] = useState('ammunition-report');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!drive.isSignedIn) {
      setStep('auth');
      return;
    }
    if (drive.folderId) {
      setView('mode-select');
    } else {
      setStep('folder');
    }
  }, [drive.isSignedIn, drive.folderId]);

  const handleCreateFolder = async () => {
    setCreating(true);
    setError(null);
    try {
      await drive.createRootFolder(folderName);
      setView('mode-select');
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת תיקייה');
    }
    setCreating(false);
  };

  const handlePickFolder = async () => {
    setError(null);
    const id = await drive.pickFolder();
    if (id) setView('mode-select');
  };

  const handlePasteId = async () => {
    if (!folderIdInput.trim()) return;
    setError(null);
    let id = folderIdInput.trim();
    const urlMatch = id.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) id = urlMatch[1];

    const valid = await drive.setFolderById(id);
    if (valid) {
      setView('mode-select');
    } else {
      setError('לא ניתן לגשת לתיקייה. ודא שהקישור נכון ושיש לך הרשאות.');
    }
  };

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
            <p className="gate-error">
              ⚠️ שילוב Google Drive לא מוגדר. יש להגדיר VITE_GOOGLE_CLIENT_ID.
            </p>
          </div>
        ) : drive.isLoading ? (
          <div className="gate-status">
            <div className="gate-spinner" />
            <p>טוען...</p>
          </div>
        ) : step === 'auth' ? (
          <div className="gate-status">
            <p>יש להתחבר ל-Google Drive כדי להמשיך:</p>
            <button className="start-btn" onClick={drive.signIn}>
              🔓 התחבר ל-Google
            </button>
          </div>
        ) : step === 'folder' ? (
          <div className="gate-status" style={{ textAlign: 'right' }}>
            <h3 style={{ marginBottom: 16 }}>לאיזו תיקייה לשמור את הנתונים?</h3>

            <div style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>שם תיקייה חדשה:</label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                />
              </div>
              <button
                className="start-btn"
                onClick={handleCreateFolder}
                disabled={creating}
              >
                {creating ? '⏳ יוצר...' : '📁 צור תיקייה חדשה'}
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                margin: '16px 0',
                color: 'var(--text-secondary)',
              }}
            >
              — או —
            </div>

            {drive.isPickerAvailable && (
              <button
                className="start-btn"
                style={{ background: '#4285f4', marginBottom: 12 }}
                onClick={handlePickFolder}
              >
                🔍 בחר תיקייה קיימת מ-Drive
              </button>
            )}

            <div className="form-group">
              <label>הדבק קישור או מזהה תיקייה:</label>
              <input
                type="text"
                value={folderIdInput}
                onChange={(e) => setFolderIdInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... או מזהה"
                dir="ltr"
              />
            </div>
            <button
              className="start-btn"
              style={{ background: 'var(--primary)' }}
              onClick={handlePasteId}
              disabled={!folderIdInput.trim()}
            >
              📋 השתמש בתיקייה זו
            </button>

            {error && (
              <p className="gate-error" style={{ marginTop: 12 }}>
                {error}
              </p>
            )}
          </div>
        ) : null}

        {drive.isSignedIn && (
          <p className="gate-user-info">
            מחובר כ: <strong>{drive.user?.email}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
