const express = require("express");
const picController = require("../../controllers/Master PIC/picController");

const router = express.Router();

router.use(picController.checkDbConnection);

router.get("/data", picController.getData);
router.post("/store", picController.storeOrUpdate);
router.delete("/delete/:id", picController.destroy);

module.exports = router;
