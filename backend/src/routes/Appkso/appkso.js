const express = require("express");

const {
  getWarehouseList,
  getData,
} = require("../../controllers/Appkso/appksoController");

const router = express.Router();

router.get("/warehouses", getWarehouseList);
router.get("/data", getData);

module.exports = router;
