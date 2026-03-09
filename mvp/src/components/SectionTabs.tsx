import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AmmoForm } from './AmmoForm';
import type { ReportSession, Section } from '../domain/types';

// ===== Tab group logic =====

interface TabGroup {
  id: string;
  label: string;
  type: 'team' | 'standalone';
  sections: string[]; // section IDs (for teams: [bellyId, outsideId])
}

function getTabGroups(session: ReportSession): TabGroup[] {
  // Team level: simple flat tabs
  if (session.unitLevel === 'team') {
    return session.sections.map((s) => ({
      id: s.id,
      label: s.label,
      type: 'standalone' as const,
      sections: [s.id],
    }));
  }

  // Platoon / Battery: group by parent team
  const groups: TabGroup[] = [];
  const teamMap = new Map<string, string[]>();
  const standalone: Section[] = [];

  for (const section of session.sections) {
    if (section.parentGroup) {
      const arr = teamMap.get(section.parentGroup) || [];
      arr.push(section.id);
      teamMap.set(section.parentGroup, arr);
    } else {
      standalone.push(section);
    }
  }

  for (const [teamName, sectionIds] of teamMap) {
    groups.push({
      id: `team-${teamName}`,
      label: teamName,
      type: 'team',
      sections: sectionIds,
    });
  }

  for (const section of standalone) {
    groups.push({
      id: section.id,
      label: section.label,
      type: 'standalone',
      sections: [section.id],
    });
  }

  return groups;
}

// ===== Component =====

export function SectionTabs() {
  const { session, saveDraft, setView } = useAppStore();
  const [mainTab, setMainTab] = useState(0);
  const [subTab, setSubTab] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');

  if (!session) return null;

  const tabGroups = getTabGroups(session);
  const currentGroup = tabGroups[mainTab] || tabGroups[0];

  let currentSectionId: string;
  if (currentGroup.type === 'team') {
    currentSectionId = currentGroup.sections[subTab] || currentGroup.sections[0];
  } else {
    currentSectionId = currentGroup.sections[0];
  }

  const handleSave = async () => {
    await saveDraft();
    setSaveMessage('✓ הטיוטה נשמרה');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  return (
    <div className="section-tabs">
      {/* Main tab bar */}
      <div className="main-tab-bar">
        {tabGroups.map((group, i) => (
          <button
            key={group.id}
            className={`main-tab ${i === mainTab ? 'active' : ''}`}
            onClick={() => {
              setMainTab(i);
              setSubTab(0);
            }}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Sub tab bar for team groups (belly / outside) */}
      {currentGroup.type === 'team' && (
        <div className="sub-tab-bar">
          <button
            className={`sub-tab ${subTab === 0 ? 'active' : ''}`}
            onClick={() => setSubTab(0)}
          >
            בטן
          </button>
          <button
            className={`sub-tab ${subTab === 1 ? 'active' : ''}`}
            onClick={() => setSubTab(1)}
          >
            חוץ
          </button>
        </div>
      )}

      {/* Ammo entry form */}
      <div className="form-container">
        <AmmoForm key={currentSectionId} sectionId={currentSectionId} />
      </div>

      {/* Bottom action bar */}
      <div className="bottom-actions">
        <button
          className={`action-btn save-btn ${saveMessage ? 'saved' : ''}`}
          onClick={handleSave}
        >
          {saveMessage || '💾 שמור טיוטה'}
        </button>
        <button className="action-btn summary-btn" onClick={() => setView('summary')}>
          📊 סיכום ויצוא
        </button>
      </div>
    </div>
  );
}
