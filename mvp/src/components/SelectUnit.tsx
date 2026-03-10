import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import {
  parseAppExcel,
  parseOldFormatExcel,
  bufferToWorkbook,
} from '../domain/excelFormat';
import type { DriveFile } from '../integrations/googleDrive';

export function SelectUnit() {
  const { catalog, loadExistingSession, setView } = useAppStore();
  const drive = useGoogleDrive();
  const [units, setUnits] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnit, setLoadingUnit] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const folders = await drive.listUnits();
      setUnits(folders);
      setLoading(false);
    };
    load();
  }, []);

  const loadFromBuffer = (
    buffer: ArrayBuffer,
    name: string,
    isMigration: boolean,
  ) => {
    const wb = bufferToWorkbook(buffer);
    const parsed = parseAppExcel(wb, catalog);

    if (parsed) {
      loadExistingSession({
        id: Date.now().toString(36),
        battalionNumber: parsed.metadata.unitNumber,
        reportDateTime: new Date().toISOString(),
        reporterName: parsed.metadata.lastModifiedBy,
        unitLevel: parsed.metadata.unitLevel,
        unitName: parsed.metadata.unitName,
        sections: parsed.sections,
        dataRevision: parsed.metadata.dataRevision,
        createdAt: parsed.metadata.createdAt,
        updatedAt: parsed.metadata.lastModifiedAt,
      });
      return true;
    }

    // Try old format
    const sections = parseOldFormatExcel(wb, catalog);
    if (sections.length > 0) {
      loadExistingSession({
        id: Date.now().toString(36),
        battalionNumber: name,
        reportDateTime: new Date().toISOString(),
        reporterName: '',
        unitLevel: 'battalion',
        unitName: name,
        sections,
        dataRevision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        migratedFromOldFormat: true,
      });
      return true;
    }

    return false;
  };

  const handleLoadUnit = async (folder: DriveFile) => {
    setLoadingUnit(folder.name);
    setError('');
    try {
      const buffer = await drive.readUnitExcel(folder.id, folder.name);
      if (!buffer) {
        setError(`לא נמצא קובץ נתונים עבור ${folder.name}`);
        setLoadingUnit(null);
        return;
      }
      if (!loadFromBuffer(buffer, folder.name, false)) {
        setError('לא ניתן לנתח את קובץ ה-Excel');
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתונים');
    }
    setLoadingUnit(null);
  };

  const handleImportFile = async () => {
    const file = await drive.pickFile(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    );
    if (!file) return;

    setLoadingUnit(file.name);
    setError('');
    try {
      const buffer = await drive.readFileById(file.id);
      const name = file.name.replace(/\.xlsx?$/i, '');
      if (!loadFromBuffer(buffer, name, true)) {
        setError('לא ניתן לנתח את קובץ ה-Excel');
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בייבוא');
    }
    setLoadingUnit(null);
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-logo">📂</div>
        <h1>בחירת יחידה</h1>
        <p className="setup-subtitle">טען נתונים קיימים מ-Drive</p>
      </div>

      <div className="setup-card">
        {loading ? (
          <div className="gate-status">
            <div className="gate-spinner" />
            <p>טוען רשימת יחידות...</p>
          </div>
        ) : units.length === 0 ? (
          <div className="gate-status">
            <p>לא נמצאו יחידות בתיקייה.</p>
          </div>
        ) : (
          <div className="unit-list">
            {units.map((folder) => (
              <div
                key={folder.id}
                className="unit-card"
                onClick={() => handleLoadUnit(folder)}
              >
                <div className="unit-card-info">
                  <strong>{folder.name}</strong>
                  {folder.modifiedTime && (
                    <span className="unit-card-date">
                      עודכן:{' '}
                      {new Date(folder.modifiedTime).toLocaleString('he-IL')}
                    </span>
                  )}
                </div>
                <div className="unit-card-action">
                  {loadingUnit === folder.name ? '⏳' : '←'}
                </div>
              </div>
            ))}
          </div>
        )}

        {drive.isPickerAvailable && (
          <button
            className="start-btn"
            style={{ marginTop: 16, background: '#4285f4' }}
            onClick={handleImportFile}
          >
            📥 ייבא קובץ Excel מ-Drive
          </button>
        )}

        <button
          className="start-btn"
          style={{ marginTop: 8 }}
          onClick={() => {
            useAppStore.getState().setMode('new');
            setView('create-unit');
          }}
        >
          🆕 צור יחידה חדשה
        </button>

        {error && <p className="gate-error">{error}</p>}

        <button className="back-link" onClick={() => setView('mode-select')}>
          ← חזור לבחירת מצב
        </button>
      </div>
    </div>
  );
}
