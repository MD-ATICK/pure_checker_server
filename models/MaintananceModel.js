const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema(
  {
    // title: { type: String, required: true },
    // description: { type: String },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

const Maintenance = mongoose.model("maintenances", MaintenanceSchema);

module.exports = Maintenance;
