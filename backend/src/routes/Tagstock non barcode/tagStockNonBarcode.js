const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // simpan di buffer memori RAM

const {
  initFilters,
  getOperatorsByWarehouse,
  processRows,
  uploadExcel,
} = require("../../controllers/Tagstock non barcode/tagStockNonBarcodeController");

const router = express.Router();

router.get("/init-filters", initFilters);
router.get("/operators", getOperatorsByWarehouse);
router.post("/process-rows", processRows);

// Tambahkan upload.single("file") di route upload
router.post("/upload", upload.single("file"), uploadExcel);

module.exports = router;
