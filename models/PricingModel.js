const { default: mongoose, Mongoose } = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      default: 5,
    },
    dayFor: {
      type: Number,
    },
    isType: {
      type: String,
    },
    credit: Number,
  },
  { timestamps: true }
);

const Plan = mongoose.model("plans", planSchema);
module.exports = Plan;
