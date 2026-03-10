import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import {
  buildNewFormatWorkbook,
  workbookToBuffer,
} from '../domain/excelFormat';
import { exportOldFormat } from '../export/excelExport';
import { getUserEmail } from '../integrations/googleDrive';
import * as XLSX from 'xlsx';

export function Summary() {
  const { session, catalog, setView, incrementRevision } = useAppStore();
  const drive = useGoogleDrive();
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [saveMessage, setSaveMessage] = useState('');

  if (!session) return null;

  // Build summary data inline
  const sectionLabels = session.sections.map((s) => s.label);

  type ModelSummary = {
    modelName: string;
    perSection: number[];
    total: number;
  };
  type GroupSummary = {
    models: ModelSummary[];
    sectionTotals: number[];
    grandTotal: number;
  };

  const groupSummaries: Record<string, GroupSummary> = {};
  let grandTotal = 0;

  for (const group of catalog) {
    const gs: GroupSummary = {
      models: [],
      sectionTotals: new Array(session.sections.length).fill(0),
      grandTotal: 0,
    };

    const modelKeys = new Set<string>();
    for (const section of session.sections) {
      for (const row of section.rows) {
        if (row.ammoType === group.type) {
          modelKeys.add(`${row.modelId}|${row.lot}`);
        }
      }
    }
    for (const model of group.models) {
      if (!group.hasLots) modelKeys.add(`${model.id}|`);
    }

    for (const key of modelKeys) {
      const [modelId, lot] = key.split('|');
      const model = group.models.find((m) => m.id === modelId);
      const displayName = lot
        ? `${model?.name || modelId} (${lot})`
        : model?.name || modelId;

      const perSection = session.sections.map((section) => {
        const match = section.rows.find(
          (r) =>
            r.ammoType === group.type &&
            r.modelId === modelId &&
            r.lot === lot,
        );
        return match
          ? Object.values(match.quantities).reduce((a, b) => a + b, 0)
          : 0;
      });
      const total = perSection.reduce((a, b) => a + b, 0);
      gs.models.push({ modelName: displayName, perSection, total });
      perSection.forEach((qty, i) => (gs.sectionTotals[i] += qty));
      gs.grandTotal += total;
    }

    grandTotal += gs.grandTotal;
    groupSummaries[group.type] = gs;
  }

  const buildWorkbook = () => {
    const metadata = {
      appVersion: '1.0',
      formatVersion: 2,
      unitNumber: session.battalionNumber,
      unitName: session.unitName,
      unitLevel: session.unitLevel,
      subUnits: session.sections.map((s) => s.label),
      createdAt: session.createdAt,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: getUserEmail(),
      dataRevision: session.dataRevision,
    };
    return buildNewFormatWorkbook(
      {
        unitName: session.unitName,
        unitLevel: session.unitLevel,
        battalionNumber: session.battalionNumber,
        subUnits: session.sections.map((s) => ({
          displayName: s.label,
          codeName: '',
          gunIds: s.gunIds,
          storageLocations: s.storageLocations,
        })),
        createdAt: session.createdAt,
        createdBy: session.reporterName,
      },
      session.sections,
      catalog,
      metadata,
    );
  };

  const handleSaveToDrive = async () => {
    setSaveStatus('saving');
    setSaveMessage('שומר...');
    try {
      const wb = buildWorkbook();
      const buffer = workbookToBuffer(wb);
      const result = await drive.saveUnitExcel(
        session.unitName,
        buffer,
        session.dataRevision,
      );
      if (result.success) {
        incrementRevision();
        setSaveStatus('success');
        setSaveMessage('✓ נשמר ל-Drive');
      } else {
        setSaveStatus('error');
        setSaveMessage(result.error || 'שגיאה בשמירה');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'שגיאה');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleDownload = () => {
    const wb = buildWorkbook();
    const safeName = session.unitName.replace(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(wb, `${safeName}-data.xlsx`);
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
        <span>
          תאריך:{' '}
          {new Date(session.reportDateTime).toLocaleString('he-IL')}
        </span>
      </div>

      <div className="grand-total-card">
        <h3>סה"כ כללי</h3>
        <div className="big-number">{grandTotal.toLocaleString()}</div>
      </div>

      {catalog.map((group) => {
        const gs = groupSummaries[group.type];
        if (!gs || gs.models.length === 0) return null;

        return (
          <div key={group.type} className="summary-group">
            <h3>{group.displayName}</h3>
            <table>
              <thead>
                <tr>
                  <th>דגם</th>
                  {sectionLabels.map((l) => (
                    <th key={l}>{l}</th>
                  ))}
                  <th>סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {gs.models.map((m, i) => (
                  <tr
                    key={i}
                    className={m.total === 0 ? 'zero-row' : ''}
                  >
                    <td>{m.modelName}</td>
                    {m.perSection.map((qty, j) => (
                      <td key={j}>{qty}</td>
                    ))}
                    <td className="total-cell">{m.total}</td>
                  </tr>
                ))}
                <tr className="subtotal-row">
                  <td>
                    <strong>סה"כ {group.displayName}</strong>
                  </td>
                  {gs.sectionTotals.map((t, i) => (
                    <td key={i}>
                      <strong>{t}</strong>
                    </td>
                  ))}
                  <td className="total-cell">
                    <strong>{gs.grandTotal}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="export-actions">
        <button className="export-btn excel-btn" onClick={handleDownload}>
          📥 הורד Excel
        </button>
        {session.migratedFromOldFormat && (
          <button
            className="export-btn"
            style={{ background: '#6b7280', color: 'white' }}
            onClick={() => exportOldFormat(session, catalog)}
          >
            📋 ייצא לפורמט ישן
          </button>
        )}
        <button
          className="export-btn pdf-btn"
          onClick={() => window.print()}
        >
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
          {saveStatus === 'saving'
            ? '⏳ שומר...'
            : '💾 שמור ל-Drive'}
        </button>
        {saveMessage && (
          <p className={`save-status save-status-${saveStatus}`}>
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
}
