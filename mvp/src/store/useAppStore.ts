import { create } from 'zustand';
import type {
  ReportSession,
  SessionSetupData,
  UnitLevel,
  Section,
  SectionType,
  SectionEntries,
  AmmoRow,
  DraftInfo,
} from '../domain/types';
import { ammoCatalog } from '../domain/catalog';
import {
  saveDraft as dbSaveDraft,
  loadDraft as dbLoadDraft,
  listDrafts as dbListDrafts,
  deleteDraft as dbDeleteDraft,
} from '../storage/db';

// ===== Helpers =====

const HEBREW_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createEmptyEntries(): SectionEntries {
  const entries: SectionEntries = {};
  ammoCatalog.forEach((group) => {
    if (group.quantityOnly) {
      // Auto-create a single row for quantity-only groups (primers)
      entries[group.type] = [
        {
          id: generateId(),
          modelId: `${group.type}-default`,
          modelName: group.displayName,
          quantity: 0,
        },
      ];
    } else {
      entries[group.type] = [];
    }
  });
  return entries;
}

function createSections(level: UnitLevel, teamNames: string[]): Section[] {
  switch (level) {
    case 'team':
      return [
        { id: 'belly', type: 'belly' as SectionType, label: 'בטן', entries: createEmptyEntries() },
        { id: 'outside', type: 'outside' as SectionType, label: 'חוץ', entries: createEmptyEntries() },
      ];

    case 'platoon': {
      const sections: Section[] = [];
      teamNames.forEach((name, i) => {
        sections.push({
          id: `team-${i}-belly`,
          type: 'belly' as SectionType,
          label: 'בטן',
          parentGroup: name,
          entries: createEmptyEntries(),
        });
        sections.push({
          id: `team-${i}-outside`,
          type: 'outside' as SectionType,
          label: 'חוץ',
          parentGroup: name,
          entries: createEmptyEntries(),
        });
      });
      sections.push({
        id: 'alpha-0',
        type: 'alpha' as SectionType,
        label: 'אלפ"א',
        entries: createEmptyEntries(),
      });
      return sections;
    }

    case 'battery': {
      const sections: Section[] = [];
      teamNames.forEach((name, i) => {
        sections.push({
          id: `team-${i}-belly`,
          type: 'belly' as SectionType,
          label: 'בטן',
          parentGroup: name,
          entries: createEmptyEntries(),
        });
        sections.push({
          id: `team-${i}-outside`,
          type: 'outside' as SectionType,
          label: 'חוץ',
          parentGroup: name,
          entries: createEmptyEntries(),
        });
      });
      sections.push({
        id: 'alpha-0',
        type: 'alpha' as SectionType,
        label: 'אלפ"א',
        entries: createEmptyEntries(),
      });
      sections.push({
        id: 'ramsaw-0',
        type: 'ramsaw' as SectionType,
        label: 'רמסע',
        entries: createEmptyEntries(),
      });
      return sections;
    }
  }
}

// ===== Store interface =====

interface AppState {
  // Navigation
  view: 'setup' | 'entry' | 'summary';
  session: ReportSession | null;
  mainTab: number;
  subTab: number;
  drafts: DraftInfo[];

  // Navigation actions
  setView: (view: 'setup' | 'entry' | 'summary') => void;
  setMainTab: (tab: number) => void;
  setSubTab: (tab: number) => void;

  // Session lifecycle
  startSession: (setup: SessionSetupData) => void;
  clearSession: () => void;

  // Ammo entry
  addRow: (sectionId: string, groupType: string) => void;
  removeRow: (sectionId: string, groupType: string, rowIndex: number) => void;
  updateRowField: (
    sectionId: string,
    groupType: string,
    rowIndex: number,
    field: string,
    value: string | number,
  ) => void;

  // Draft persistence
  saveDraft: () => Promise<void>;
  loadDraftById: (id: string) => Promise<void>;
  deleteDraftById: (id: string) => Promise<void>;
  refreshDrafts: () => Promise<void>;

  // User preferences (localStorage)
  getLastPrefs: () => {
    reporterName: string;
    unitLevel: UnitLevel | null;
    battalionNumber: string;
  };
  savePrefs: (reporterName: string, unitLevel: UnitLevel, battalionNumber: string) => void;
}

// ===== Store implementation =====

export const useAppStore = create<AppState>((set, get) => ({
  view: 'setup',
  session: null,
  mainTab: 0,
  subTab: 0,
  drafts: [],

  setView: (view) => set({ view }),
  setMainTab: (tab) => set({ mainTab: tab, subTab: 0 }),
  setSubTab: (tab) => set({ subTab: tab }),

  startSession: (setup) => {
    const teamNames =
      setup.unitLevel !== 'team'
        ? setup.teamNames.length > 0
          ? setup.teamNames
          : [1, 2].map((_, i) => `צוות ${HEBREW_LETTERS[i]}'`)
        : [];

    const session: ReportSession = {
      id: generateId(),
      battalionNumber: setup.battalionNumber,
      reportDateTime: setup.reportDateTime,
      reporterName: setup.reporterName,
      unitLevel: setup.unitLevel,
      unitName: setup.unitName,
      sections: createSections(setup.unitLevel, teamNames),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({ session, view: 'entry', mainTab: 0, subTab: 0 });
    get().savePrefs(setup.reporterName, setup.unitLevel, setup.battalionNumber);
  },

  clearSession: () => {
    set({ session: null, view: 'setup', mainTab: 0, subTab: 0 });
  },

  addRow: (sectionId, groupType) => {
    set((state) => {
      if (!state.session) return state;

      const group = ammoCatalog.find((g) => g.type === groupType);
      const newRow: AmmoRow = {
        id: generateId(),
        modelId: '',
        modelName: '',
        quantity: 0,
      };
      if (group?.requiresSerial) {
        newRow.serial = '';
      }

      const sections = state.session.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const newEntries = { ...s.entries };
        newEntries[groupType] = [...(s.entries[groupType] || []), newRow];
        return { ...s, entries: newEntries };
      });

      return {
        session: { ...state.session, sections, updatedAt: new Date().toISOString() },
      };
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

      return {
        session: { ...state.session, sections, updatedAt: new Date().toISOString() },
      };
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

      return {
        session: { ...state.session, sections, updatedAt: new Date().toISOString() },
      };
    });
  },

  saveDraft: async () => {
    const { session } = get();
    if (!session) return;
    await dbSaveDraft(session);
    await get().refreshDrafts();
  },

  loadDraftById: async (id) => {
    const session = await dbLoadDraft(id);
    if (session) {
      set({ session, view: 'entry', mainTab: 0, subTab: 0 });
    }
  },

  deleteDraftById: async (id) => {
    await dbDeleteDraft(id);
    await get().refreshDrafts();
  },

  refreshDrafts: async () => {
    const drafts = await dbListDrafts();
    set({ drafts });
  },

  getLastPrefs: () => ({
    reporterName: localStorage.getItem('ammo-reporter') || '',
    unitLevel: (localStorage.getItem('ammo-level') as UnitLevel) || null,
    battalionNumber: localStorage.getItem('ammo-battalion') || '334',
  }),

  savePrefs: (reporterName, unitLevel, battalionNumber) => {
    localStorage.setItem('ammo-reporter', reporterName);
    localStorage.setItem('ammo-level', unitLevel);
    localStorage.setItem('ammo-battalion', battalionNumber);
  },
}));

/** Generate default team names: צוות א', צוות ב', etc. */
export function generateTeamNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `צוות ${HEBREW_LETTERS[i]}'`);
}
