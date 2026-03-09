import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { buildNormalizedReport } from '../domain/reportModel';
import { exportToExcel } from '../export/excelExport';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

export function Summary() {
  const { session, catalog, setView } = useAppStore();
  const drive = useGoogleDrive();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  if (!session) return null;

  const report = buildNormalizedReport(session, catalog);

  /** Build a human-readable CSV from the report */
  const buildReportCSV = (): string => {
    const rows: string[] = [];
    rows.push(['קטגוריה', 'דגם', ...report.sectionLabels, 'סה"כ'].join(','));

    for (const group of catalog) {
      const groupData = report.groupTotals[group.type];
      if (!groupData) continue;
      for (const model of groupData.models) {
        rows.push([group.displayName, model.modelName, ...model.perSection, model.total].join(','));
      }
      rows.push([`סה"כ ${group.displayName}`, '', ...groupData.sectionTotals, groupData.grandTotal].join(','));
      rows.push('');
    }

    const perSection = report.sectionLabels.map((_, i) =>
      catalog.reduce((sum, g) => sum + (report.groupTotals[g.type]?.sectionTotals[i] || 0), 0),
    );
    rows.push(['סה"כ כללי', '', ...perSection, report.grandTotal].join(','));
    return rows.join('\n');
  };

  const handleSaveToDrive = async () => {
    setSaveStatus('saving');
    setSaveMessage('שומר...');

    // Save JSON data
    const jsonOk = await drive.saveData(session.unitName, session);
    // Save CSV report
    const csvOk = await drive.saveCsv(session.unitName, buildReportCSV());

    if (jsonOk && csvOk) {
      setSaveStatus('success');
      setSaveMessage('✓ נשמר ל-Drive (נתונים + CSV)');
    } else {
      setSaveStatus('error');
      setSaveMessage('שגיאה בשמירה ל-Drive');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <div className="summary-container">
      <div className="summary-header">
        <button className="back-btn" onClick={() => setView('entry')}>
          ← חזור להזנה
        </button>
        <h2>סיכום דוח</h2>
      </div>

      <div className="report-info">
        <span>גדוד: {session.battalionNumber}</span>
        <span>יחידה: {session.unitName}</span>
        <span>מדווח: {session.reporterName}</span>
        <span>תאריך: {new Date(session.reportDateTime).toLocaleString('he-IL')}</span>
      </div>

      <div className="grand-total-card">
        <h3>סה"כ כללי</h3>
        <div className="big-number">{report.grandTotal.toLocaleString()}</div>
      </div>

      {catalog.map((group) => {
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
                  <td><strong>סה"כ {group.displayName}</strong></td>
                  {groupData.sectionTotals.map((total, i) => (
                    <td key={i}><strong>{total}</strong></td>
                  ))}
                  <td className="total-cell"><strong>{groupData.grandTotal}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="export-actions">
        <button className="export-btn excel-btn" onClick={() => exportToExcel(session, report, catalog)}>
          📥 יצוא ל-Excel
        </button>
        <button className="export-btn pdf-btn" onClick={() => window.print()}>
          🖨️ הדפסה / PDF
        </button>
      </div>

      <div className="drive-section">
        <h3>שמירה ל-Google Drive</h3>
        <button
          className="drive-btn"
          onClick={handleSaveToDrive}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? '⏳ שומר...' : '💾 שמור נתונים + CSV ל-Drive'}
        </button>
        {saveMessage && <p className={`save-status save-status-${saveStatus}`}>{saveMessage}</p>}
      </div>
    </div>
  );
}
