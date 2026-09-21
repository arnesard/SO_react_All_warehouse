export const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return {
    day,
    hasOracle: [3, 4, 5, 10, 11, 12, 17, 18, 19, 24, 25].includes(day),
    hasBarcode: [4, 5, 11, 12, 18, 19, 25, 26].includes(day),
  };
});

export const PATTERN_ROWS = [
  { id: 1, pattern: "FDR 70/90-17", counted: 842, onhand: 850, sku_minus: 3, sku_plus: 1 },
  { id: 2, pattern: "SCT-001 130/70-13", counted: 615, onhand: 615, sku_minus: 0, sku_plus: 0 },
  { id: 3, pattern: "IRC NR73 80/90-14", counted: 398, onhand: 410, sku_minus: 5, sku_plus: 0 },
  { id: 4, pattern: "SWALLOW SB-118 90/80-17", counted: 522, onhand: 518, sku_minus: 0, sku_plus: 2 },
  { id: 5, pattern: "ZENEOS ZM77 100/80-14", counted: 276, onhand: 276, sku_minus: 0, sku_plus: 0 },
  { id: 6, pattern: "FDR SP99 90/90-14", counted: 431, onhand: 448, sku_minus: 4, sku_plus: 0 },
  { id: 7, pattern: "CORSA R46 110/70-17", counted: 189, onhand: 189, sku_minus: 0, sku_plus: 0 },
  { id: 8, pattern: "SCT-002 140/70-17", counted: 305, onhand: 296, sku_minus: 0, sku_plus: 3 },
];

export function buildRowStatus(row) {
  const diff = row.onhand - row.counted;
  if (diff === 0) return { tone: "ok", label: "MATCH" };
  if (Math.abs(diff) <= 5) return { tone: "warn", label: "SELISIH TIPIS" };
  return { tone: "danger", label: "SELISIH" };
}
