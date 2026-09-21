require("dotenv").config();
const express = require("express");
const cors = require("cors");

const masterSizeRoutes = require("./src/routes/masterSize");
const barcodeMonstockRoutes = require("./src/routes/barcodeMonstock");
const snapshotRoutes = require("./src/routes/snapshot");

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

const PORT = process.env.PORT || 8010;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
