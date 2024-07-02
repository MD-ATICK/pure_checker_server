const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
      required: true,
    },
    // accountType: {
    //   type: String,
    //   enum: ["normal", "google"],
    //   default: "normal",
    // },
    isVerify: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: "googleHasNoPassword",
    },
    credit: { type: Number, default: 100 },
    ip: String,
    subscription: {
      type: Boolean,
      default: false,
    },
    payAsGo: {
      type: Boolean,
      default: false,
    },
    subPerDayCredit: {
      type: Number,
      default: 0,
    },
    subLastDate: {
      type: String,
      default: "",
    },
    subEndDate: {
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
    deliverable: Number,
    invalid: Number,
    apiUsage: Number,
    apiUsageHistory: [
      {
        invalid: Number,
        deliverable: Number,
        apiUsage: Number,
        Date: String,
      },
    ],
    country: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    zipCode: {
      type: String,
      default: "",
    },
    mobileNumber: {
      type: Number,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("users", userSchema);
module.exports = User;
