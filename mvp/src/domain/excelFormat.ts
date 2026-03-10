import * as XLSX from 'xlsx';
import type { Section, AmmoGroupDef, ExcelMetadata, AmmoDataRow, UnitConfig } from './types';

// ===== Helpers =====

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Build new-format workbook =====

export function buildNewFormatWorkbook(
  config: UnitConfig,
  sections: Section[],
  catalog: AmmoGroupDef[],
  metadata: ExcelMetadata,
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. _metadata sheet
  writeMetadataSheet(wb, metadata);

  // 2. config sheet
  writeConfigSheet(wb, config);

  // 3. Per sub-unit sheets
  for (const section of sections) {
    writeSubUnitSheet(wb, section);
  }

  // 4. ריכוז (summary) sheet
  writeSummarySheet(wb, sections, catalog);

  return wb;
}

function writeMetadataSheet(wb: XLSX.WorkBook, meta: ExcelMetadata): void {
  const data: (string | number | boolean)[][] = [
    ['field', 'value'],
    ['app_version', meta.appVersion],
    ['format_version', meta.formatVersion],
    ['created_by_app', 'true'],
    ['unit_number', meta.unitNumber],
    ['unit_name', meta.unitName],
    ['unit_level', meta.unitLevel],
    ['sub_units', meta.subUnits.join(', ')],
    ['created_at', meta.createdAt],
    ['last_modified_at', meta.lastModifiedAt],
    ['last_modified_by', meta.lastModifiedBy],
    ['data_revision', meta.dataRevision],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, '_metadata');
}

function writeConfigSheet(wb: XLSX.WorkBook, config: UnitConfig): void {
  const data: string[][] = [
    ['field', ...config.subUnits.map((s) => s.displayName)],
    ['code_name', ...config.subUnits.map((s) => s.codeName)],
    ['guns', ...config.subUnits.map((s) => s.gunIds.join(', '))],
    ['storage_locations', ...config.subUnits.map((s) => s.storageLocations.join(', '))],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'config');
}

function writeSubUnitSheet(wb: XLSX.WorkBook, section: Section): void {
  const allColumns = [...section.gunIds, ...section.storageLocations];
  const gunCount = section.gunIds.length;
  const storageCount = section.storageLocations.length;

  // Header row
  const header = ['ammo_type', 'model', 'lot', ...allColumns, 'סה"כ קנים', 'סה"כ אחסון', 'סה"כ'];
  const data: (string | number)[][] = [header];

  for (const row of section.rows) {
    const rowData: (string | number)[] = [row.ammoType, row.modelName, row.lot];
    let gunTotal = 0;
    let storageTotal = 0;

    for (let i = 0; i < allColumns.length; i++) {
      const qty = row.quantities[allColumns[i]] || 0;
      rowData.push(qty);
      if (i < gunCount) gunTotal += qty;
      else storageTotal += qty;
    }

    rowData.push(gunTotal, storageTotal, gunTotal + storageTotal);
    data.push(rowData);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Add SUM formulas for total columns
  const dataStartCol = 3;
  for (let r = 1; r < data.length; r++) {
    const rowNum = r + 1;
    const gunTotalIdx = dataStartCol + allColumns.length;
    const storageTotalIdx = gunTotalIdx + 1;
    const grandTotalIdx = storageTotalIdx + 1;

    if (gunCount > 0) {
      const from = XLSX.utils.encode_col(dataStartCol);
      const to = XLSX.utils.encode_col(dataStartCol + gunCount - 1);
      ws[XLSX.utils.encode_col(gunTotalIdx) + rowNum] = {
        t: 'n',
        f: `SUM(${from}${rowNum}:${to}${rowNum})`,
      };
    }
    if (storageCount > 0) {
      const from = XLSX.utils.encode_col(dataStartCol + gunCount);
      const to = XLSX.utils.encode_col(dataStartCol + gunCount + storageCount - 1);
      ws[XLSX.utils.encode_col(storageTotalIdx) + rowNum] = {
        t: 'n',
        f: `SUM(${from}${rowNum}:${to}${rowNum})`,
      };
    }
    const gc = XLSX.utils.encode_col(gunTotalIdx);
    const sc = XLSX.utils.encode_col(storageTotalIdx);
    ws[XLSX.utils.encode_col(grandTotalIdx) + rowNum] = {
      t: 'n',
      f: `${gc}${rowNum}+${sc}${rowNum}`,
    };
  }

  // RTL
  if (!ws['!views']) ws['!views'] = [];
  (ws['!views'] as Array<{ RTL?: boolean }>)[0] = { RTL: true };

  XLSX.utils.book_append_sheet(wb, ws, section.label);
}

function writeSummarySheet(
  wb: XLSX.WorkBook,
  sections: Section[],
  catalog: AmmoGroupDef[],
): void {
  const header = ['ammo_type', 'model', ...sections.map((s) => s.label), 'סה"כ'];
  const data: (string | number)[][] = [header];

  // Collect all unique row keys across sections
  const allRowKeys = new Map<string, { ammoType: string; modelName: string; lot: string }>();
  for (const section of sections) {
    for (const row of section.rows) {
      const key = `${row.ammoType}|${row.modelId}|${row.lot}`;
      if (!allRowKeys.has(key)) {
        allRowKeys.set(key, { ammoType: row.ammoType, modelName: row.modelName, lot: row.lot });
      }
    }
  }

  for (const [key, info] of allRowKeys) {
    const [ammoType, modelId, lot] = key.split('|');
    const displayName = lot ? `${info.modelName} ${lot}` : info.modelName;
    const rowData: (string | number)[] = [ammoType, displayName];
    let total = 0;

    for (const section of sections) {
      const matchingRow = section.rows.find(
        (r) => r.ammoType === ammoType && r.modelId === modelId && r.lot === lot,
      );
      const sectionTotal = matchingRow
        ? Object.values(matchingRow.quantities).reduce((a, b) => a + b, 0)
        : 0;
      rowData.push(sectionTotal);
      total += sectionTotal;
    }

    rowData.push(total);
    data.push(rowData);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  if (!ws['!views']) ws['!views'] = [];
  (ws['!views'] as Array<{ RTL?: boolean }>)[0] = { RTL: true };
  XLSX.utils.book_append_sheet(wb, ws, 'ריכוז');
}

// ===== Read new-format workbook =====

export function readMetadata(wb: XLSX.WorkBook): ExcelMetadata | null {
  const ws = wb.Sheets['_metadata'];
  if (!ws) return null;

  const data = XLSX.utils.sheet_to_json<{ field: string; value: string | number | boolean }>(ws);
  const map = new Map(data.map((r) => [r.field, r.value]));

  return {
    appVersion: String(map.get('app_version') || '1.0'),
    formatVersion: Number(map.get('format_version') || 1),
    unitNumber: String(map.get('unit_number') || ''),
    unitName: String(map.get('unit_name') || ''),
    unitLevel: (String(map.get('unit_level') || 'battalion') as ExcelMetadata['unitLevel']),
    subUnits: String(map.get('sub_units') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    createdAt: String(map.get('created_at') || ''),
    lastModifiedAt: String(map.get('last_modified_at') || ''),
    lastModifiedBy: String(map.get('last_modified_by') || ''),
    dataRevision: Number(map.get('data_revision') || 0),
  };
}

export function parseAppExcel(
  wb: XLSX.WorkBook,
  catalog: AmmoGroupDef[],
): { sections: Section[]; metadata: ExcelMetadata } | null {
  const metadata = readMetadata(wb);
  if (!metadata) return null;

  // Read config sheet for gun IDs and storage locations
  const configWs = wb.Sheets['config'];
  const configRaw: Record<string, string>[] = configWs
    ? XLSX.utils.sheet_to_json<Record<string, string>>(configWs)
    : [];
  const configMap: Record<string, Record<string, string>> = {};
  for (const row of configRaw) {
    if (row.field) configMap[row.field] = row;
  }

  const sections: Section[] = [];

  for (const subUnitName of metadata.subUnits) {
    const ws = wb.Sheets[subUnitName];
    if (!ws) continue;

    const sheetData: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);
    if (sheetData.length === 0) continue;

    // Get gun/storage columns from config
    const gunsStr = configMap['guns']?.[subUnitName] || '';
    const storageStr = configMap['storage_locations']?.[subUnitName] || '';
    const gunIds = gunsStr
      ? gunsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const storageLocations = storageStr
      ? storageStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const allCols = [...gunIds, ...storageLocations];

    // If no config, infer columns from sheet headers
    if (allCols.length === 0) {
      const skipCols = new Set(['ammo_type', 'model', 'lot', 'סה"כ קנים', 'סה"כ אחסון', 'סה"כ']);
      for (const key of Object.keys(sheetData[0])) {
        if (!skipCols.has(key)) allCols.push(key);
      }
    }

    const rows: AmmoDataRow[] = [];
    for (const dataRow of sheetData) {
      const ammoType = String(dataRow['ammo_type'] || '');
      const modelName = String(dataRow['model'] || '');
      const lot = String(dataRow['lot'] || '');

      const group = catalog.find((g) => g.type === ammoType);
      const model = group?.models.find((m) => m.name === modelName);
      const modelId = model?.id || modelName;

      const quantities: Record<string, number> = {};
      for (const col of allCols) {
        quantities[col] = Number(dataRow[col]) || 0;
      }

      rows.push({ id: generateId(), ammoType, modelId, modelName, lot, quantities });
    }

    sections.push({
      id: generateId(),
      label: subUnitName,
      gunIds: gunIds.length > 0 ? gunIds : allCols,
      storageLocations,
      rows,
    });
  }

  return { sections, metadata };
}

// ===== Parse old-format Excel =====

export function parseOldFormatExcel(
  wb: XLSX.WorkBook,
  catalog: AmmoGroupDef[],
): Section[] {
  const sections: Section[] = [];

  for (const sheetName of wb.SheetNames) {
    // Skip summary/meta/copy sheets
    if (sheetName.includes('ריכוז') || sheetName.includes('עותק')) continue;

    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length < 2) continue;

    const headers = (data[0] || []).map((h: any) => String(h || '').trim());

    const SUMMARY_COLS = ['סה"כ', 'סה"כ קנים', 'סה"כ בונקר'];
    const gunIds: string[] = [];
    const storageLocations: string[] = [];
    const dataColIndices: { col: string; index: number }[] = [];

    for (let i = 1; i < headers.length; i++) {
      const h = headers[i];
      if (!h || SUMMARY_COLS.some((s) => h.includes(s)) || h === 'תחמושת') continue;

      const isStorage = /^(ד\d|רמסע|מפיק|בונקר)/i.test(h);
      if (isStorage) {
        storageLocations.push(h);
      } else {
        gunIds.push(h);
      }
      dataColIndices.push({ col: h, index: i });
    }

    const rows: AmmoDataRow[] = [];
    for (let r = 1; r < data.length; r++) {
      const rowData = data[r] || [];
      const firstCell = String(rowData[0] || '').trim();
      if (!firstCell) continue;

      const classified = classifyAmmoRow(firstCell, catalog);
      if (!classified.type) continue;

      const quantities: Record<string, number> = {};
      for (const { col, index } of dataColIndices) {
        quantities[col] = parseOldValue(rowData[index]);
      }

      rows.push({
        id: generateId(),
        ammoType: classified.type,
        modelId: classified.modelId,
        modelName: classified.modelName,
        lot: classified.lot,
        quantities,
      });
    }

    if (rows.length > 0) {
      sections.push({
        id: generateId(),
        label: sheetName.trim(),
        gunIds,
        storageLocations,
        rows,
      });
    }
  }

  return sections;
}

function classifyAmmoRow(
  text: string,
  catalog: AmmoGroupDef[],
): { type: string; modelId: string; modelName: string; lot: string } {
  const clean = text.trim();

  for (const group of catalog) {
    for (const model of group.models) {
      if (clean.includes(model.name) || clean.startsWith(model.name)) {
        if (group.hasLots) {
          const lotPart = clean.replace(model.name, '').trim();
          return { type: group.type, modelId: model.id, modelName: model.name, lot: lotPart };
        }
        return { type: group.type, modelId: model.id, modelName: model.name, lot: '' };
      }
    }
  }

  if (/תחלים/.test(clean)) {
    return { type: 'primer', modelId: 'PRIMER', modelName: 'תחלים', lot: '' };
  }

  return { type: '', modelId: '', modelName: '', lot: '' };
}

function parseOldValue(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace('?', '').trim();
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}

// ===== Workbook <-> ArrayBuffer =====

export function workbookToBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return out as ArrayBuffer;
}

export function bufferToWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: 'array' });
}
