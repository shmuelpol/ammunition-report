import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ammoCatalog } from '../domain/catalog';
import { buildNormalizedReport } from '../domain/reportModel';
import { exportToExcel } from '../export/excelExport';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

export function Summary() {
  const { session, setView } = useAppStore();
  const { isSignedIn, user, isLoading, signIn, saveReport, isConfigured } = useGoogleDrive();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  if (!session) return null;

  const report = buildNormalizedReport(session);

  const handleSaveToDrive = async () => {
    setSaveStatus('saving');
    setSaveMessage('שומר...');

    const fileName = `דוח_תחמושת_${session.unitName}_${session.reportDateTime.replace(/[:.]/g, '-')}.json`;
    const result = await saveReport(session, fileName);

    if (result.success) {
      setSaveStatus('success');
      setSaveMessage(`✓ נשמר לתיקייה ב-Google Drive`);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setSaveMessage(`שגיאה: ${result.error}`);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="summary-container">
      {/* Header */}
      <div className="summary-header">
        <button className="back-btn" onClick={() => setView('entry')}>
          ← חזור להזנה
        </button>
        <h2>סיכום דוח</h2>
      </div>

      {/* Report metadata */}
      <div className="report-info">
        <span>גדוד: {session.battalionNumber}</span>
        <span>יחידה: {session.unitName}</span>
        <span>מדווח: {session.reporterName}</span>
        <span>תאריך: {new Date(session.reportDateTime).toLocaleString('he-IL')}</span>
      </div>

      {/* Grand total card */}
      <div className="grand-total-card">
        <h3>סה"כ כללי</h3>
        <div className="big-number">{report.grandTotal.toLocaleString()}</div>
      </div>

      {/* Per-group tables */}
      {ammoCatalog.map((group) => {
        const groupData = report.groupTotals[group.type];
        if (!groupData) return null;

        return (
          <div key={group.type} className="summary-group">
            <h3>{group.displayName}</h3>
            <table>
              <thead>
                <tr>
                  <th>דגם</th>
                  {report.sectionLabels.map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                  <th>סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {groupData.models.map((model) => (
                  <tr key={model.modelId} className={model.total === 0 ? 'zero-row' : ''}>
                    <td>{model.modelName}</td>
                    {model.perSection.map((qty, i) => (
                      <td key={i}>{qty}</td>
                    ))}
                    <td className="total-cell">{model.total}</td>
                  </tr>
                ))}
                <tr className="subtotal-row">
                  <td>
                    <strong>סה"כ {group.displayName}</strong>
                  </td>
                  {groupData.sectionTotals.map((total, i) => (
                    <td key={i}>
                      <strong>{total}</strong>
                    </td>
                  ))}
                  <td className="total-cell">
                    <strong>{groupData.grandTotal}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Export buttons */}
      <div className="export-actions">
        <button className="export-btn excel-btn" onClick={() => exportToExcel(session, report)}>
          📥 יצוא ל-Excel
        </button>
        <button className="export-btn pdf-btn" onClick={() => window.print()}>
          🖨️ הדפסה / PDF
        </button>
      </div>

      {/* Google Drive section */}
      <div className="drive-section">
        <h3>Google Drive</h3>
        {!isConfigured ? (
          <p className="drive-not-configured">
            ⚠️ שילוב Google Drive לא מוגדר. יש להגדיר <code>VITE_GOOGLE_CLIENT_ID</code> בקובץ <code>.env.local</code>.
            <br />
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
              פתח Google Cloud Console →
            </a>
          </p>
        ) : isLoading ? (
          <p>טוען Google Drive...</p>
        ) : isSignedIn ? (
          <div>
            <p>✓ מחובר כ: <strong>{user?.email}</strong></p>
            <button
              className="drive-btn"
              onClick={handleSaveToDrive}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? '⏳ שומר...' : '💾 שמור ל-Google Drive'}
            </button>
            {saveMessage && <p className={`save-status save-status-${saveStatus}`}>{saveMessage}</p>}
          </div>
        ) : (
          <div>
            <p>חבר לחשבון Google לשמור דיווחים ישירות לתיקייה שלך:</p>
            <button className="drive-btn" onClick={signIn}>
              🔓 התחבר ל-Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
