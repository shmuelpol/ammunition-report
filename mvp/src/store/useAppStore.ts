import { create } from 'zustand';
import type {
  ReportSession,
  UnitLevel,
  Section,
  SectionType,
  SectionEntries,
  AmmoRow,
  AmmoGroupDef,
  UnitConfig,
  AppMode,
} from '../domain/types';

// ===== Helpers =====

const HEBREW_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createEmptyEntries(catalog: AmmoGroupDef[]): SectionEntries {
  const entries: SectionEntries = {};
  catalog.forEach((group) => {
    if (group.quantityOnly) {
      entries[group.type] = [
        { id: generateId(), modelId: `${group.type}-default`, modelName: group.displayName, quantity: 0 },
      ];
    } else {
      entries[group.type] = [];
    }
  });
  return entries;
}

function createSections(level: UnitLevel, teamNames: string[], catalog: AmmoGroupDef[]): Section[] {
  switch (level) {
    case 'team':
      return [
        { id: 'belly', type: 'belly' as SectionType, label: 'בטן', entries: createEmptyEntries(catalog) },
        { id: 'outside', type: 'outside' as SectionType, label: 'חוץ', entries: createEmptyEntries(catalog) },
      ];

    case 'platoon': {
      const sections: Section[] = [];
      teamNames.forEach((name, i) => {
        sections.push({
          id: `team-${i}-belly`, type: 'belly' as SectionType, label: 'בטן',
          parentGroup: name, entries: createEmptyEntries(catalog),
        });
        sections.push({
          id: `team-${i}-outside`, type: 'outside' as SectionType, label: 'חוץ',
          parentGroup: name, entries: createEmptyEntries(catalog),
        });
      });
      sections.push({ id: 'alpha-0', type: 'alpha' as SectionType, label: 'אלפ"א', entries: createEmptyEntries(catalog) });
      return sections;
    }

    case 'battery': {
      const sections: Section[] = [];
      teamNames.forEach((name, i) => {
        sections.push({
          id: `team-${i}-belly`, type: 'belly' as SectionType, label: 'בטן',
          parentGroup: name, entries: createEmptyEntries(catalog),
        });
        sections.push({
          id: `team-${i}-outside`, type: 'outside' as SectionType, label: 'חוץ',
          parentGroup: name, entries: createEmptyEntries(catalog),
        });
      });
      sections.push({ id: 'alpha-0', type: 'alpha' as SectionType, label: 'אלפ"א', entries: createEmptyEntries(catalog) });
      sections.push({ id: 'ramsaw-0', type: 'ramsaw' as SectionType, label: 'רמסע', entries: createEmptyEntries(catalog) });
      return sections;
    }
  }
}

// ===== Views =====
export type AppView = 'drive-gate' | 'mode-select' | 'create-unit' | 'select-unit' | 'entry' | 'summary';

// ===== Store interface =====

interface AppState {
  view: AppView;
  session: ReportSession | null;
  catalog: AmmoGroupDef[];
  mode: AppMode | null;
  mainTab: number;
  subTab: number;

  // Navigation
  setView: (view: AppView) => void;
  setMainTab: (tab: number) => void;
  setSubTab: (tab: number) => void;

  // Catalog (loaded from Drive)
  setCatalog: (catalog: AmmoGroupDef[]) => void;

  // Mode
  setMode: (mode: AppMode) => void;

  // Session lifecycle
  startNewUnit: (config: UnitConfig, catalog: AmmoGroupDef[]) => void;
  loadExistingSession: (session: ReportSession) => void;
  clearSession: () => void;

  // Ammo entry
  addRow: (sectionId: string, groupType: string) => void;
  removeRow: (sectionId: string, groupType: string, rowIndex: number) => void;
  updateRowField: (
    sectionId: string, groupType: string, rowIndex: number,
    field: string, value: string | number,
  ) => void;
}

// ===== Store implementation =====

export const useAppStore = create<AppState>((set, get) => ({
  view: 'drive-gate',
  session: null,
  catalog: [],
  mode: null,
  mainTab: 0,
  subTab: 0,

  setView: (view) => set({ view }),
  setMainTab: (tab) => set({ mainTab: tab, subTab: 0 }),
  setSubTab: (tab) => set({ subTab: tab }),

  setCatalog: (catalog) => set({ catalog }),

  setMode: (mode) => set({ mode }),

  startNewUnit: (config, catalog) => {
    const teamNames = config.unitLevel !== 'team'
      ? config.teamNames.length > 0
        ? config.teamNames
        : [1, 2].map((_, i) => `צוות ${HEBREW_LETTERS[i]}'`)
      : [];

    const session: ReportSession = {
      id: generateId(),
      battalionNumber: config.battalionNumber,
      reportDateTime: new Date().toISOString(),
      reporterName: config.createdBy,
      unitLevel: config.unitLevel,
      unitName: config.unitName,
      sections: createSections(config.unitLevel, teamNames, catalog),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({ session, view: 'entry', mainTab: 0, subTab: 0, catalog });
  },

  loadExistingSession: (session) => {
    set({ session, view: 'entry', mainTab: 0, subTab: 0 });
  },

  clearSession: () => {
    set({ session: null, view: 'mode-select', mainTab: 0, subTab: 0, mode: null });
  },

  addRow: (sectionId, groupType) => {
    set((state) => {
      if (!state.session) return state;
      const group = state.catalog.find((g) => g.type === groupType);
      const newRow: AmmoRow = { id: generateId(), modelId: '', modelName: '', quantity: 0 };
      if (group?.requiresSerial) newRow.serial = '';
      const sections = state.session.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const newEntries = { ...s.entries };
        newEntries[groupType] = [...(s.entries[groupType] || []), newRow];
        return { ...s, entries: newEntries };
      });
      return { session: { ...state.session, sections, updatedAt: new Date().toISOString() } };
    });
  },

  removeRow: (sectionId, groupType, rowIndex) => {
    set((state) => {
      if (!state.session) return state;
      const sections = state.session.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const newEntries = { ...s.entries };
        newEntries[groupType] = s.entries[groupType].filter((_, i) => i !== rowIndex);
        return { ...s, entries: newEntries };
      });
      return { session: { ...state.session, sections, updatedAt: new Date().toISOString() } };
    });
  },

  updateRowField: (sectionId, groupType, rowIndex, field, value) => {
    set((state) => {
      if (!state.session) return state;
      const sections = state.session.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const newEntries = { ...s.entries };
        newEntries[groupType] = s.entries[groupType].map((row, i) => {
          if (i !== rowIndex) return row;
          return { ...row, [field]: value };
        });
        return { ...s, entries: newEntries };
      });
      return { session: { ...state.session, sections, updatedAt: new Date().toISOString() } };
    });
  },
}));

/** Generate default team names */
export function generateTeamNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `צוות ${HEBREW_LETTERS[i]}'`);
}
