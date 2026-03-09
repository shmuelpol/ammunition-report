// ===== Unit hierarchy =====
export type UnitLevel = 'team' | 'platoon' | 'battery';
export type SectionType = 'belly' | 'outside' | 'alpha' | 'ramsaw';
export type AmmoGroupType = 'shell' | 'charge' | 'fuse' | 'primer' | 'bullet';

// ===== Catalog definitions =====
export interface AmmoModelDef {
  id: string;
  name: string;
}

export interface AmmoGroupDef {
  type: AmmoGroupType;
  displayName: string;
  models: AmmoModelDef[];
  requiresSerial: boolean;
  quantityOnly: boolean; // true = no model selection (e.g. primers)
}

// ===== Data entries =====
export interface AmmoRow {
  id: string;
  modelId: string;
  modelName: string;
  quantity: number;
  serial?: string;
}

export interface SectionEntries {
  [groupType: string]: AmmoRow[];
}

export interface Section {
  id: string;
  type: SectionType;
  label: string;
  parentGroup?: string; // team name for belly/outside within a team
  entries: SectionEntries;
}

// ===== Session =====
export interface ReportSession {
  id: string;
  battalionNumber: string;
  reportDateTime: string;
  reporterName: string;
  unitLevel: UnitLevel;
  unitName: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionSetupData {
  battalionNumber: string;
  reportDateTime: string;
  reporterName: string;
  unitLevel: UnitLevel;
  unitName: string;
  teamNames: string[];
}

// ===== Draft info for listing =====
export interface DraftInfo {
  id: string;
  unitName: string;
  unitLevel: UnitLevel;
  reporterName: string;
  updatedAt: string;
}

// ===== Display labels =====
export const UNIT_LEVEL_LABELS: Record<UnitLevel, string> = {
  team: 'צוות',
  platoon: 'פלגה',
  battery: 'סוללה',
};

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  belly: 'בטן',
  outside: 'חוץ',
  alpha: 'אלפ"א',
  ramsaw: 'רמסע',
};
