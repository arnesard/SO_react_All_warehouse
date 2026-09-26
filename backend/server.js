require("dotenv").config();
const express = require("express");
const cors = require("cors");

const masterSizeRoutes = require("./src/routes/Master Size/masterSize");
const barcodeMonstockRoutes = require("./src/routes/Barcode Monstock/barcodeMonstock");
const snapshotRoutes = require("./src/routes/Snapshot/snapshot");
const picRoutes = require("./src/routes/Master PIC/pic");
const tagStockRoutes = require("./src/routes/Tagstock/tagStock");
const tagStockNonBarcodeRoutes = require("./src/routes/Tagstock non barcode/tagStockNonBarcode");
const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "API Running",
  });
});

app.use("/api/master-size", masterSizeRoutes);
app.use("/api/barcode-monstock", barcodeMonstockRoutes);
app.use("/api/snapshot", snapshotRoutes);
app.use("/api/pic", picRoutes);
app.use("/api/tagstock", tagStockRoutes);
app.use("/api/tagstock-nonbarcode", tagStockNonBarcodeRoutes);

const PORT = process.env.PORT || 8010;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
