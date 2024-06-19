const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    credit: { type: Number, default: 100 },
    ip: String,
    subscription: {
      type: Boolean,
      default: false,
    },
    perDayCredit: { type: Number },
    payAsGo: {
      type: Boolean,
      default: false,
    },
    lastDate: {
      type: String,
      default: "",
    },
    endDate: {
      type: String,
      default: "",
    },
    block: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("users", userSchema);
module.exports = User;
