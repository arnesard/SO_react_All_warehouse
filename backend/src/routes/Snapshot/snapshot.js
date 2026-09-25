const express = require("express");
const snapshotController = require("../../controllers/Snapshot/snapshotController");

const router = express.Router();

// Middleware validasi DB
router.use(snapshotController.checkDbConnection);

// Definisi Endpoint
router.get("/get-warehouses", snapshotController.getWarehouses);
router.get("/data", snapshotController.getData);
router.post("/import", snapshotController.importSnapshot);

module.exports = router;
