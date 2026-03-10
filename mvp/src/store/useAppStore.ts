import { create } from 'zustand';
import type {
  ReportSession,
  Section,
  AmmoDataRow,
  AmmoGroupDef,
  UnitConfig,
  AppMode,
} from '../domain/types';
import { DEFAULT_CATALOG } from '../domain/catalog';

// ===== Helpers =====

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createInitialRows(
  catalog: AmmoGroupDef[],
  columns: string[],
): AmmoDataRow[] {
  const rows: AmmoDataRow[] = [];
  const emptyQty: Record<string, number> = {};
  columns.forEach((c) => (emptyQty[c] = 0));

  for (const group of catalog) {
    if (group.hasLots) continue; // charges start empty, user adds lots
    for (const model of group.models) {
      rows.push({
        id: generateId(),
        ammoType: group.type,
        modelId: model.id,
        modelName: model.name,
        lot: '',
        quantities: { ...emptyQty },
      });
    }
  }
  return rows;
}

function createSections(config: UnitConfig, catalog: AmmoGroupDef[]): Section[] {
  return config.subUnits.map((su) => {
    const columns = [...su.gunIds, ...su.storageLocations];
    return {
      id: generateId(),
      label: su.displayName,
      gunIds: su.gunIds,
      storageLocations: su.storageLocations,
      rows: createInitialRows(catalog, columns),
    };
  });
}

// ===== Views =====
export type AppView =
  | 'drive-gate'
  | 'mode-select'
  | 'create-unit'
  | 'select-unit'
  | 'entry'
  | 'summary';

// ===== Store interface =====

interface AppState {
  view: AppView;
  session: ReportSession | null;
  catalog: AmmoGroupDef[];
  mode: AppMode | null;
  mainTab: number;
  subTab: number;
  remoteRevision: number | null;

  setView: (view: AppView) => void;
  setMainTab: (tab: number) => void;
  setSubTab: (tab: number) => void;
  setCatalog: (catalog: AmmoGroupDef[]) => void;
  setMode: (mode: AppMode) => void;

  // Session lifecycle
  startNewUnit: (config: UnitConfig) => void;
  loadExistingSession: (session: ReportSession) => void;
  clearSession: () => void;
  setRemoteRevision: (rev: number) => void;
  incrementRevision: () => void;

  // Ammo entry
  updateQuantity: (
    sectionId: string,
    rowId: string,
    columnId: string,
    value: number,
  ) => void;
  addLotRow: (
    sectionId: string,
    modelId: string,
    modelName: string,
    lot: string,
  ) => void;
  removeLotRow: (sectionId: string, rowId: string) => void;
}

// ===== Store implementation =====

export const useAppStore = create<AppState>((set, get) => ({
  view: 'drive-gate',
  session: null,
  catalog: DEFAULT_CATALOG,
  mode: null,
  mainTab: 0,
  subTab: 0,
  remoteRevision: null,

  setView: (view) => set({ view }),
  setMainTab: (tab) => set({ mainTab: tab, subTab: 0 }),
  setSubTab: (tab) => set({ subTab: tab }),
  setCatalog: (catalog) => set({ catalog }),
  setMode: (mode) => set({ mode }),

  startNewUnit: (config) => {
    const catalog = get().catalog;
    const session: ReportSession = {
      id: generateId(),
      battalionNumber: config.battalionNumber,
      reportDateTime: new Date().toISOString(),
      reporterName: config.createdBy,
      unitLevel: config.unitLevel,
      unitName: config.unitName,
      sections: createSections(config, catalog),
      dataRevision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ session, view: 'entry', mainTab: 0, subTab: 0 });
  },

  loadExistingSession: (session) => {
    set({
      session,
      view: 'entry',
      mainTab: 0,
      subTab: 0,
      remoteRevision: session.dataRevision,
    });
  },

  clearSession: () => {
    set({
      session: null,
      view: 'mode-select',
      mainTab: 0,
      subTab: 0,
      mode: null,
      remoteRevision: null,
    });
  },

  setRemoteRevision: (rev) => set({ remoteRevision: rev }),

  incrementRevision: () => {
    set((state) => {
      if (!state.session) return state;
      const newRev = state.session.dataRevision + 1;
      return {
        session: { ...state.session, dataRevision: newRev },
        remoteRevision: newRev,
      };
    });
  },

  updateQuantity: (sectionId, rowId, columnId, value) => {
    set((state) => {
      if (!state.session) return state;
      const sections = state.session.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const rows = s.rows.map((r) => {
          if (r.id !== rowId) return r;
          return { ...r, quantities: { ...r.quantities, [columnId]: value } };
        });
        return { ...s, rows };
      });
      return {
        session: {
          ...state.session,
          sections,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  addLotRow: (sectionId, modelId, modelName, lot) => {
    set((state) => {
      if (!state.session) return state;
      const sections = state.session.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const columns = [...s.gunIds, ...s.storageLocations];
        const emptyQty: Record<string, number> = {};
        columns.forEach((c) => (emptyQty[c] = 0));

        const newRow: AmmoDataRow = {
          id: generateId(),
          ammoType: 'charge',
          modelId,
          modelName,
          lot,
          quantities: emptyQty,
        };
        return { ...s, rows: [...s.rows, newRow] };
      });
      return {
        session: {
          ...state.session,
          sections,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  removeLotRow: (sectionId, rowId) => {
    set((state) => {
      if (!state.session) return state;
      const sections = state.session.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, rows: s.rows.filter((r) => r.id !== rowId) };
      });
      return {
        session: {
          ...state.session,
          sections,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },
}));
