import Dexie, { type Table } from 'dexie';
import type { ReportSession, DraftInfo } from '../domain/types';

class AmmoReportDB extends Dexie {
  drafts!: Table<ReportSession, string>;

  constructor() {
    super('AmmoReportDB');
    this.version(1).stores({
      drafts: 'id, unitLevel, unitName, updatedAt',
    });
  }
}

export const db = new AmmoReportDB();

export async function saveDraft(session: ReportSession): Promise<void> {
  const updated = { ...session, updatedAt: new Date().toISOString() };
  await db.drafts.put(updated);
}

export async function loadDraft(id: string): Promise<ReportSession | undefined> {
  return await db.drafts.get(id);
}

export async function listDrafts(): Promise<DraftInfo[]> {
  const all = await db.drafts.orderBy('updatedAt').reverse().toArray();
  return all.map((d) => ({
    id: d.id,
    unitName: d.unitName,
    unitLevel: d.unitLevel,
    reporterName: d.reporterName,
    updatedAt: d.updatedAt,
  }));
}

export async function deleteDraft(id: string): Promise<void> {
  await db.drafts.delete(id);
}

/** Request persistent storage so the browser won't evict IndexedDB data */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}
