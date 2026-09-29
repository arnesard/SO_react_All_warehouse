const express = require("express");
const {
  getComparisonData,
  getDetailPattern,
  getScanHistory,
  getUnscannedItems,
  getDetailPricePattern,
  getDetailGrade,
  getDetailPpm,
} = require("../../controllers/Dasboard/dashboardController");

const router = express.Router();

router.get("/comparison", getComparisonData);
router.get("/detail-pattern", getDetailPattern);
router.get("/scan-history", getScanHistory);
router.get("/unscanned-items", getUnscannedItems);
router.get("/detail-price-pattern", getDetailPricePattern);
router.get("/detail-grade", getDetailGrade);
router.get("/detail-ppm", getDetailPpm);

module.exports = router;
