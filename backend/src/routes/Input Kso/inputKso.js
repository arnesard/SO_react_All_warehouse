const express = require("express");
const {
  initEventSo,
  getActiveEvent,
  checkItemInfo,
  savePicScan,
  validateDoc,
  getRecentScans,
} = require("../../controllers/Input Kso/inputKsoController");

const router = express.Router();

router.post("/init-event", initEventSo);
router.get("/active-event", getActiveEvent);
router.get("/check-item", checkItemInfo);
router.post("/scan-pic", savePicScan);
router.post("/validate-doc", validateDoc);
router.get("/recent-scans", getRecentScans);

module.exports = router;
