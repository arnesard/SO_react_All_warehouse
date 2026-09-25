const express = require("express");
const tagStockController = require("../../controllers/Tagstock/tagStockController");

const router = express.Router();

router.use(tagStockController.checkDbConnection);

router.get("/init-filters", tagStockController.initFilters);
router.get("/operators", tagStockController.getOperatorsByWarehouse);
router.post("/process-rows", tagStockController.processRows);
router.post("/validate-appkso", tagStockController.validateAppkso);
router.get("/scan-history", tagStockController.getScanHistory);

module.exports = router;
