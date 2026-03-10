// ===== Unit hierarchy =====
export type UnitLevel = 'battery' | 'battalion';

// ===== Catalog definitions =====
export interface AmmoModelDef {
  id: string;
  name: string;
}

export interface AmmoGroupDef {
  type: string;
  displayName: string;
  models: AmmoModelDef[];
  quantityOnly: boolean;
  hasLots: boolean;
}

// ===== Sub-unit definition =====
export interface SubUnitDef {
  displayName: string;
  codeName: string;
  gunIds: string[];
  storageLocations: string[];
}

// ===== Excel metadata =====
export interface ExcelMetadata {
  appVersion: string;
  formatVersion: number;
  unitNumber: string;
  unitName: string;
  unitLevel: UnitLevel;
  subUnits: string[];
  createdAt: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  dataRevision: number;
}

// ===== Data row (per ammo item across all locations) =====
export interface AmmoDataRow {
  id: string;
  ammoType: string;
  modelId: string;
  modelName: string;
  lot: string;
  quantities: Record<string, number>;
}

// ===== Section (one per sub-unit) =====
export interface Section {
  id: string;
  label: string;
  gunIds: string[];
  storageLocations: string[];
  rows: AmmoDataRow[];
}

// ===== Unit config =====
export interface UnitConfig {
  unitName: string;
  unitLevel: UnitLevel;
  battalionNumber: string;
  subUnits: SubUnitDef[];
  createdAt: string;
  createdBy: string;
}

// ===== App mode =====
export type AppMode = 'new' | 'update';

// ===== Session =====
export interface ReportSession {
  id: string;
  battalionNumber: string;
  reportDateTime: string;
  reporterName: string;
  unitLevel: UnitLevel;
  unitName: string;
  sections: Section[];
  dataRevision: number;
  createdAt: string;
  updatedAt: string;
  migratedFromOldFormat?: boolean;
}

// ===== Display labels =====
export const UNIT_LEVEL_LABELS: Record<UnitLevel, string> = {
  battery: 'סוללה',
  battalion: 'גדוד',
};
