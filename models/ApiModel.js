const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const apiSchema = new mongoose.Schema(
  {
    userId: String,
    apiName: String,
    apiKey: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    deliverable: {
      type: Number,
      default: 0,
    },
    invalid: {
      type: Number,
      default: 0,
    },
    apiUsage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Api = mongoose.model("api", apiSchema);
module.exports = Api;
