import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AmmoForm } from './AmmoForm';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import {
  buildNewFormatWorkbook,
  workbookToBuffer,
} from '../domain/excelFormat';
import { getUserEmail } from '../integrations/googleDrive';

export function SectionTabs() {
  const { session, catalog, setView, incrementRevision } = useAppStore();
  const drive = useGoogleDrive();
  const [mainTab, setMainTab] = useState(0);
  const [subTab, setSubTab] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);

  if (!session) return null;

  const sections = session.sections;
  const currentSection = sections[mainTab] || sections[0];
  const allColumns = [...currentSection.gunIds, ...currentSection.storageLocations];
  const currentColumn = allColumns[subTab] || allColumns[0];

  const handleSave = async () => {
    if (!session || saving) return;
    setSaving(true);
    setSaveMessage('');

    try {
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
        dataRevision: session.dataRevision + 1,
      };

      const wb = buildNewFormatWorkbook(
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

      const buffer = workbookToBuffer(wb);
      const result = await drive.saveUnitExcel(
        session.unitName,
        buffer,
        session.dataRevision,
      );

      if (result.success) {
        incrementRevision();
        setSaveMessage('✓ נשמר ל-Drive');
      } else {
        setSaveMessage(`✕ ${result.error || 'שגיאה בשמירה'}`);
      }
    } catch (err: any) {
      setSaveMessage(`✕ ${err.message || 'שגיאה'}`);
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="section-tabs">
      {/* Main tabs — sub-units */}
      {sections.length > 1 && (
        <div className="main-tab-bar">
          {sections.map((section, i) => (
            <button
              key={section.id}
              className={`main-tab ${i === mainTab ? 'active' : ''}`}
              onClick={() => {
                setMainTab(i);
                setSubTab(0);
              }}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      {/* Sub tabs — locations (guns + storage) */}
      {allColumns.length > 0 && (
        <div className="sub-tab-bar" style={{ overflowX: 'auto' }}>
          {allColumns.map((col, i) => (
            <button
              key={col}
              className={`sub-tab ${i === subTab ? 'active' : ''}`}
              onClick={() => setSubTab(i)}
              style={{ minWidth: 'auto', padding: '10px 14px', whiteSpace: 'nowrap' }}
            >
              {col}
            </button>
          ))}
        </div>
      )}

      {/* Ammo form for current section + column */}
      <div className="form-container">
        <AmmoForm
          key={`${currentSection.id}-${currentColumn}`}
          sectionId={currentSection.id}
          columnId={currentColumn}
        />
      </div>

      {/* Bottom actions */}
      <div className="bottom-actions">
        <button
          className={`action-btn save-btn ${saveMessage.startsWith('✓') ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '⏳ שומר...' : saveMessage || '💾 שמור ל-Drive'}
        </button>
        <button
          className="action-btn summary-btn"
          onClick={() => setView('summary')}
        >
          📊 סיכום ויצוא
        </button>
      </div>
    </div>
  );
}
