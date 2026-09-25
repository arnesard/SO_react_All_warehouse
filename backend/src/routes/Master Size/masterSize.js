const express = require("express");
const masterSizeController = require("../../controllers/Master Size/masterSizeController");

const router = express.Router();

// Middleware validasi DB
router.use(masterSizeController.checkDbConnection);

// Endpoint definitions
router.get("/data", masterSizeController.getData);
router.post("/store", masterSizeController.store);
router.post("/update/:id", masterSizeController.update);
router.delete("/delete/:id", masterSizeController.destroy);

module.exports = router;
