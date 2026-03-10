import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import type { UnitLevel, UnitConfig, SubUnitDef } from '../domain/types';
import { UNIT_LEVEL_LABELS } from '../domain/types';
import { buildNewFormatWorkbook, workbookToBuffer } from '../domain/excelFormat';
import { getUserEmail } from '../integrations/googleDrive';

const HEBREW_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];

export function CreateUnit() {
  const { catalog, startNewUnit, setView } = useAppStore();
  const drive = useGoogleDrive();

  const [battalionNumber, setBattalionNumber] = useState(
    localStorage.getItem('ammo-battalion') || '',
  );
  const [reporterName, setReporterName] = useState(
    localStorage.getItem('ammo-reporter') || '',
  );
  const [unitLevel, setUnitLevel] = useState<UnitLevel>('battalion');
  const [unitName, setUnitName] = useState('');
  const [subUnits, setSubUnits] = useState<SubUnitDef[]>([
    { displayName: "סוללה א'", codeName: '', gunIds: [], storageLocations: [] },
    { displayName: "סוללה ב'", codeName: '', gunIds: [], storageLocations: [] },
  ]);
  const [batteryGuns, setBatteryGuns] = useState('');
  const [batteryStorage, setBatteryStorage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddSubUnit = () => {
    const i = subUnits.length;
    setSubUnits([
      ...subUnits,
      {
        displayName: `סוללה ${HEBREW_LETTERS[i] || i + 1}'`,
        codeName: '',
        gunIds: [],
        storageLocations: [],
      },
    ]);
  };

  const handleRemoveSubUnit = (index: number) => {
    if (subUnits.length <= 1) return;
    setSubUnits(subUnits.filter((_, i) => i !== index));
  };

  const updateSubUnit = (index: number, field: string, value: string) => {
    setSubUnits(
      subUnits.map((su, i) => {
        if (i !== index) return su;
        if (field === 'gunIds' || field === 'storageLocations') {
          return {
            ...su,
            [field]: value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          };
        }
        return { ...su, [field]: value };
      }),
    );
  };

  const handleCreate = async () => {
    if (!reporterName.trim()) {
      alert('נא להזין שם מדווח');
      return;
    }
    if (!unitName.trim()) {
      alert('נא להזין שם יחידה');
      return;
    }

    setSaving(true);
    setError('');

    let finalSubUnits: SubUnitDef[];
    if (unitLevel === 'battery') {
      finalSubUnits = [
        {
          displayName: unitName.trim(),
          codeName: '',
          gunIds: batteryGuns
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          storageLocations: batteryStorage
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      ];
    } else {
      finalSubUnits = subUnits;
    }

    const config: UnitConfig = {
      unitName: unitName.trim(),
      unitLevel,
      battalionNumber: battalionNumber.trim(),
      subUnits: finalSubUnits,
      createdAt: new Date().toISOString(),
      createdBy: reporterName.trim(),
    };

    try {
      const wb = buildNewFormatWorkbook(config, [], catalog, {
        appVersion: '1.0',
        formatVersion: 2,
        unitNumber: battalionNumber.trim(),
        unitName: unitName.trim(),
        unitLevel,
        subUnits: finalSubUnits.map((s) => s.displayName),
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: getUserEmail(),
        dataRevision: 1,
      });
      const buffer = workbookToBuffer(wb);

      const result = await drive.saveUnitExcel(unitName.trim(), buffer, 1);
      if (!result.success) {
        setError(result.error || 'שגיאה בשמירה ל-Drive');
        setSaving(false);
        return;
      }

      localStorage.setItem('ammo-reporter', reporterName.trim());
      localStorage.setItem('ammo-battalion', battalionNumber.trim());

      startNewUnit(config);
    } catch (err: any) {
      setError(err.message || 'שגיאה');
      setSaving(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-logo">🆕</div>
        <h1>יחידה חדשה</h1>
        <p className="setup-subtitle">הגדרת יחידה ותת-יחידות</p>
      </div>

      <div className="setup-card">
        <div className="form-group">
          <label>מספר גדוד</label>
          <input
            type="text"
            value={battalionNumber}
            onChange={(e) => setBattalionNumber(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>שם מדווח</label>
          <input
            type="text"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="הכנס שם..."
          />
        </div>

        <div className="form-group">
          <label>רמת יחידה</label>
          <div className="level-selector">
            {(['battery', 'battalion'] as UnitLevel[]).map((level) => (
              <button
                key={level}
                className={`level-btn ${unitLevel === level ? 'active' : ''}`}
                onClick={() => setUnitLevel(level)}
              >
                {UNIT_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>שם יחידה</label>
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder="לדוגמה: גדוד 9294"
          />
        </div>

        {unitLevel === 'battery' ? (
          <>
            <div className="form-group">
              <label>מזהי קנים (מופרדים בפסיק)</label>
              <input
                type="text"
                value={batteryGuns}
                onChange={(e) => setBatteryGuns(e.target.value)}
                placeholder="1א, 1ב, 1ג, 2א, 2ב, 2ג"
                dir="rtl"
              />
            </div>
            <div className="form-group">
              <label>מיקומי אחסון (מופרדים בפסיק)</label>
              <input
                type="text"
                value={batteryStorage}
                onChange={(e) => setBatteryStorage(e.target.value)}
                placeholder="מפיק, ד1, ד2, רמסע 1"
                dir="rtl"
              />
            </div>
          </>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: 8,
                fontSize: '0.9em',
                color: 'var(--text-secondary)',
              }}
            >
              תת-יחידות (סוללות)
            </label>
            {subUnits.map((su, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--primary-bg)',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="text"
                    value={su.displayName}
                    onChange={(e) => updateSubUnit(i, 'displayName', e.target.value)}
                    style={{
                      flex: 1,
                      padding: 8,
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                    }}
                  />
                  <input
                    type="text"
                    value={su.codeName}
                    onChange={(e) => updateSubUnit(i, 'codeName', e.target.value)}
                    placeholder="כינוי"
                    style={{
                      flex: 1,
                      padding: 8,
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                    }}
                  />
                  {subUnits.length > 1 && (
                    <button
                      onClick={() => handleRemoveSubUnit(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2em',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={su.gunIds.join(', ')}
                  onChange={(e) => updateSubUnit(i, 'gunIds', e.target.value)}
                  placeholder="קנים: 1א, 1ב, 1ג, 2א, 2ב, 2ג"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                />
                <input
                  type="text"
                  value={su.storageLocations.join(', ')}
                  onChange={(e) => updateSubUnit(i, 'storageLocations', e.target.value)}
                  placeholder="אחסון: מפיק, ד1, ד2, רמסע 1"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
            <button className="add-row-btn" onClick={handleAddSubUnit}>
              + הוסף תת-יחידה
            </button>
          </div>
        )}

        {error && <p className="gate-error">{error}</p>}

        <button className="start-btn" onClick={handleCreate} disabled={saving}>
          {saving ? '⏳ שומר...' : '✅ צור יחידה והתחל'}
        </button>

        <button className="back-link" onClick={() => setView('mode-select')}>
          ← חזור לבחירת מצב
        </button>
      </div>
    </div>
  );
}
