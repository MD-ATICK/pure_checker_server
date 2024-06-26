const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const paymentSchema = new mongoose.Schema(
  {
    planType: String,
    price: Number,
    credit: Number,
    userId : String,
    dayLimit: Number,
    currency: String,
    status : {
      type : String,
      default : 'pending'
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
