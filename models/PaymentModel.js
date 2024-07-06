const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const paymentSchema = new mongoose.Schema(
  {
    planType: String,
    price: Number,
    credit: Number,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    dayLimit: Number,
    currency: String,
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "success", "refund"],
    },
    paymentId: {
      type: String,
      default: uuidv4,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("payments", paymentSchema);
module.exports = Payment;
