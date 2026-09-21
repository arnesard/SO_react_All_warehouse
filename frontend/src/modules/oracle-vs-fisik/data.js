// Data dummy — dipakai sementara untuk preview tampilan frontend.
// Nanti diganti hasil fetch dari backend Node/Express per modul.

export const SCAN_ACTIVITY = [
  { id: 1, opr_id: "OP-1042", nama_opr: "Deni Kurniawan", no_kso: "KSO-08841", item_code: "FDR7017", deskripsi: "FDR 70/90-17 TT", qty_scan: 24 },
  { id: 2, opr_id: "OP-1108", nama_opr: "Siti Marlina", no_kso: "KSO-08842", item_code: "SCT001", deskripsi: "SCT-001 130/70-13", qty_scan: 18 },
  { id: 3, opr_id: "OP-1042", nama_opr: "Deni Kurniawan", no_kso: "KSO-08843", item_code: "IRCNR73", deskripsi: "IRC NR73 80/90-14", qty_scan: 12 },
  { id: 4, opr_id: "OP-1215", nama_opr: "Ahmad Fauzi", no_kso: "KSO-08844", item_code: "SWSB118", deskripsi: "SWALLOW SB-118 90/80-17", qty_scan: 30 },
  { id: 5, opr_id: "OP-1108", nama_opr: "Siti Marlina", no_kso: "KSO-08845", item_code: "ZMZ77", deskripsi: "ZENEOS ZM77 100/80-14", qty_scan: 9 },
];

export const PROGRESS_GEDUNG_A = [
  { id: 1, item: "FDR7017", desc: "FDR 70/90-17 TT", sisa: 120, progres: 78 },
  { id: 2, item: "SCT001", desc: "SCT-001 130/70-13", sisa: 40, progres: 92 },
  { id: 3, item: "IRCNR73", desc: "IRC NR73 80/90-14", sisa: 210, progres: 45 },
  { id: 4, item: "SWSB118", desc: "SWALLOW SB-118 90/80-17", sisa: 15, progres: 97 },
];

export const PROGRESS_GEDUNG_B = [
  { id: 1, item: "ZMZ77", desc: "ZENEOS ZM77 100/80-14", sisa: 88, progres: 60 },
  { id: 2, item: "FDRSP99", desc: "FDR SP99 90/90-14", sisa: 176, progres: 33 },
  { id: 3, item: "CORSAR46", desc: "CORSA R46 110/70-17", sisa: 5, progres: 99 },
  { id: 4, item: "SCT002", desc: "SCT-002 140/70-17", sisa: 60, progres: 71 },
];

export const PATTERN_SUMMARY = [
  { id: 1, pattern: "FDR 70/90-17", counted: 842, onhand: 850, sku_minus: 3, sku_plus: 1 },
  { id: 2, pattern: "SCT-001 130/70-13", counted: 615, onhand: 615, sku_minus: 0, sku_plus: 0 },
  { id: 3, pattern: "IRC NR73 80/90-14", counted: 398, onhand: 410, sku_minus: 5, sku_plus: 0 },
];

export const MASTER_SIZE = [
  { id: 1, warehouse: "FG MOTOR 1", item: "FDR7017", desc: "FDR 70/90-17 TT", grade: "A", product: "Tube Type", type: "Motor", brand: "FDR", category: "Ban Depan", pattern: "SP-66" },
  { id: 2, warehouse: "FG MOTOR 1", item: "SCT001", desc: "SCT-001 130/70-13", grade: "A", product: "Tubeless", type: "Motor", brand: "Swallow", category: "Ban Belakang", pattern: "SCT" },
  { id: 3, warehouse: "FG MOTOR 2", item: "IRCNR73", desc: "IRC NR73 80/90-14", grade: "B", product: "Tube Type", type: "Motor", brand: "IRC", category: "Ban Depan", pattern: "NR73" },
  { id: 4, warehouse: "FG MOTOR 2", item: "SWSB118", desc: "SWALLOW SB-118 90/80-17", grade: "A", product: "Tubeless", type: "Motor", brand: "Swallow", category: "Ban Belakang", pattern: "SB-118" },
  { id: 5, warehouse: "GUDANG TRANSIT", item: "ZMZ77", desc: "ZENEOS ZM77 100/80-14", grade: "A", product: "Tube Type", type: "Motor", brand: "Zeneos", category: "Ban Depan", pattern: "ZM77" },
];

export const BARCODE_MONSTOCK = [
  { id: 1, warehouse: "FG MOTOR 1", rack_code: "BRB-A01-03", item_code: "FDR7017", desc: "FDR 70/90-17 TT", jml_pcs: 48, oem_pcs: 6, loc_code: "A-01-03" },
  { id: 2, warehouse: "FG MOTOR 1", rack_code: "BRB-A02-11", item_code: "SCT001", desc: "SCT-001 130/70-13", jml_pcs: 32, oem_pcs: 0, loc_code: "A-02-11" },
  { id: 3, warehouse: "FG MOTOR 2", rack_code: "BRB-B04-05", item_code: "IRCNR73", desc: "IRC NR73 80/90-14", jml_pcs: 60, oem_pcs: 12, loc_code: "B-04-05" },
  { id: 4, warehouse: "FG MOTOR 2", rack_code: "BRB-B05-02", item_code: "SWSB118", desc: "SWALLOW SB-118 90/80-17", jml_pcs: 20, oem_pcs: 0, loc_code: "B-05-02" },
];

export const TAG_STOCK = [
  { id: 1, lot: "LOT-2609A", no_doc: "DOC-3301", item: "FDR7017", desc: "FDR 70/90-17 TT", jml_rak: 6, qty: 288, jml_aktual: 284 },
  { id: 2, lot: "LOT-2609B", no_doc: "DOC-3302", item: "SCT001", desc: "SCT-001 130/70-13", jml_rak: 4, qty: 192, jml_aktual: 192 },
  { id: 3, lot: "LOT-2609C", no_doc: "DOC-3303", item: "IRCNR73", desc: "IRC NR73 80/90-14", jml_rak: 8, qty: 384, jml_aktual: 372 },
];

export const TAG_STOCK_NONBARCODE = [
  { id: 1, lot: "LOT-2609D", no_doc: "DOC-3304", item: "SWSB118", desc: "SWALLOW SB-118 90/80-17", jml_rak: 3, qty: 144, jml_aktual: 144 },
  { id: 2, lot: "LOT-2609E", no_doc: "DOC-3305", item: "ZMZ77", desc: "ZENEOS ZM77 100/80-14", jml_rak: 5, qty: 240, jml_aktual: 231 },
];

export const APPKSO_PATTERN = [
  { id: 1, pattern: "FDR 70/90-17", total_sku: 22, total_qty: 850 },
  { id: 2, pattern: "SCT-001 130/70-13", total_sku: 15, total_qty: 615 },
  { id: 3, pattern: "IRC NR73 80/90-14", total_sku: 18, total_qty: 410 },
];

export const APPKSO_OPERATOR = [
  { id: 1, operator: "Deni Kurniawan", total_sku: 28, total_qty: 940 },
  { id: 2, operator: "Siti Marlina", total_sku: 24, total_qty: 812 },
  { id: 3, operator: "Ahmad Fauzi", total_sku: 19, total_qty: 606 },
];

export const APPKSO_DETAIL = [
  { id: 1, warehouse: "FG MOTOR 1", tanggal: "2026-09-18", opr: "OP-1042", operator: "Deni Kurniawan", no_kso: "KSO-08841", item: "FDR7017", desc: "FDR 70/90-17 TT", qty: 24, verifikasi: "Sudah", tgl_verifikasi: "2026-09-18" },
  { id: 2, warehouse: "FG MOTOR 1", tanggal: "2026-09-18", opr: "OP-1108", operator: "Siti Marlina", no_kso: "KSO-08842", item: "SCT001", desc: "SCT-001 130/70-13", qty: 18, verifikasi: "Belum", tgl_verifikasi: "-" },
];

export const SNAPSHOT_ROWS = [
  { id: 1, wh: "FG MOTOR 1", item_code: "FDR7017", desc: "FDR 70/90-17 TT", qty_oracle: 850 },
  { id: 2, wh: "FG MOTOR 1", item_code: "SCT001", desc: "SCT-001 130/70-13", qty_oracle: 615 },
  { id: 3, wh: "FG MOTOR 2", item_code: "IRCNR73", desc: "IRC NR73 80/90-14", qty_oracle: 410 },
  { id: 4, wh: "FG MOTOR 2", item_code: "SWSB118", desc: "SWALLOW SB-118 90/80-17", qty_oracle: 518 },
];

export const PROGRESS_SO = [
  { id: 1, gedung: "FG MOTOR 1", no_kso: "KSO-08841", pic_stock: "Rudi Hartono", auditor: "Yuli Astuti", item: "FDR7017", desc: "FDR 70/90-17 TT", qty: 850, keterangan: "Sesuai" },
  { id: 2, gedung: "FG MOTOR 1", no_kso: "KSO-08842", pic_stock: "Rudi Hartono", auditor: "Yuli Astuti", item: "SCT001", desc: "SCT-001 130/70-13", qty: 615, keterangan: "Sesuai" },
  { id: 3, gedung: "FG MOTOR 2", no_kso: "KSO-08843", pic_stock: "Nanang Suryana", auditor: "Bambang Wijaya", item: "IRCNR73", desc: "IRC NR73 80/90-14", qty: 410, keterangan: "Selisih -12" },
  { id: 4, gedung: "GUDANG TRANSIT", no_kso: "KSO-08844", pic_stock: "Nanang Suryana", auditor: "Bambang Wijaya", item: "ZMZ77", desc: "ZENEOS ZM77 100/80-14", qty: 276, keterangan: "Sesuai" },
];

export const PIC_ROWS = [
  { id: 1, warehouse: "FG MOTOR 1", penneng: "PN-0231", nama: "Rudi Hartono", gedung: "Gedung A", lot: "LOT-2609A" },
  { id: 2, warehouse: "FG MOTOR 1", penneng: "PN-0245", nama: "Yuli Astuti", gedung: "Gedung A", lot: "LOT-2609B" },
  { id: 3, warehouse: "FG MOTOR 2", penneng: "PN-0198", nama: "Nanang Suryana", gedung: "Gedung B", lot: "LOT-2609C" },
  { id: 4, warehouse: "GUDANG TRANSIT", penneng: "PN-0302", nama: "Bambang Wijaya", gedung: "Gedung C", lot: "LOT-2609D" },
];

export const WAREHOUSES = ["FG MOTOR 1", "FG MOTOR 2", "GUDANG TRANSIT"];
