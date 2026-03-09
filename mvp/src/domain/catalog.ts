import type { AmmoGroupDef } from './types';

/**
 * Parse the ammunition-types CSV template loaded from Google Drive.
 *
 * Expected CSV columns:
 *   group_type, display_name, model_id, model_name, requires_serial, quantity_only
 *
 * For quantity-only groups (e.g. primers), model_id and model_name can be empty.
 */
export function parseCatalogCSV(csvText: string): AmmoGroupDef[] {
  const lines = csvText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // skip header row
  const dataLines = lines.slice(1);
  const groupMap = new Map<string, AmmoGroupDef>();

  for (const line of dataLines) {
    const cols = line.split(',').map((c) => c.trim());
    if (cols.length < 6) continue;

    const [groupType, displayName, modelId, modelName, requiresSerial, quantityOnly] = cols;

    if (!groupMap.has(groupType)) {
      groupMap.set(groupType, {
        type: groupType,
        displayName,
        models: [],
        requiresSerial: requiresSerial.toLowerCase() === 'true',
        quantityOnly: quantityOnly.toLowerCase() === 'true',
      });
    }

    const group = groupMap.get(groupType)!;
    if (modelId && modelName) {
      group.models.push({ id: modelId, name: modelName });
    }
  }

  return Array.from(groupMap.values());
}

/**
 * Convert catalog back to CSV for reference / round-trip.
 */
export function catalogToCSV(catalog: AmmoGroupDef[]): string {
  const header = 'group_type,display_name,model_id,model_name,requires_serial,quantity_only';
  const rows: string[] = [header];

  for (const group of catalog) {
    if (group.quantityOnly || group.models.length === 0) {
      rows.push(`${group.type},${group.displayName},,,${group.requiresSerial},${group.quantityOnly}`);
    } else {
      for (const model of group.models) {
        rows.push(
          `${group.type},${group.displayName},${model.id},${model.name},${group.requiresSerial},${group.quantityOnly}`,
        );
      }
    }
  }

  return rows.join('\n');
}
