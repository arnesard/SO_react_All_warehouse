const express = require("express");
const {
  getProgressData,
  getAuditorDetail,
} = require("../../controllers/Progress/progressController");

const router = express.Router();

router.get("/data", getProgressData);
router.get("/detail", getAuditorDetail);

module.exports = router;
