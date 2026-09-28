const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  getWarehouseList,
  getData,
  importExcel,
} = require("../../controllers/Appkso/appksoController");

const router = express.Router();

router.get("/warehouses", getWarehouseList);
router.get("/data", getData);
router.post("/import", upload.single("file"), importExcel);

module.exports = router;
