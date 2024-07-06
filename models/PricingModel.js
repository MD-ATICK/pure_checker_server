const { default: mongoose, Mongoose } = require("mongoose");

const volumeSchema = new mongoose.Schema(
  {
    planType: {
      type: String,
      enum: ["subscription", "payAsGo"],
    },
    perDay: Number,
    totalCredits: Number,
    price: Number,
  },
  { timestamps: true }
);

const Volume = mongoose.model("volumes", volumeSchema);
module.exports = Volume;
