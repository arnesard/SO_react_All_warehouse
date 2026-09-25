const express = require("express");
const multer = require("multer");
// Mundur 2 kali ke src, lalu masuk ke controllers/Barcode Monstock/
const barcodeMonstockController = require("../../controllers/Barcode Monstock/barcodeMonstockController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware cek DB
router.use(barcodeMonstockController.checkDbConnection);

// Definisi Endpoint
router.get("/data", barcodeMonstockController.getData);
router.post(
  "/import",
  upload.single("file_csv"),
  barcodeMonstockController.importCsv,
);
router.delete("/delete/:id", barcodeMonstockController.deleteById);
router.post("/truncate-all", barcodeMonstockController.truncateAll);

module.exports = router;
