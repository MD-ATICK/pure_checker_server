const { default: mongoose, Mongoose } = require("mongoose");

// const defaultPlan = {
//   type: "Daily",
//   payment: "Pay monthly",
// planType  : 'subscription
//   description: "Per Day Credits",
//   question: "How many emails do you want to verify daily?",
//   volumePrompt: "Select your email verification volume",
//   volumes: ["100", "500", "1K", "2K", "3K", "5K", "10K", "25K", "50K"],
//   customVolumePrompt: "Have custom volume need?",
//   price: "$900",
//   priceNote: "/ month",
//   creditsPerDay: "50,000 credits / day",
//   buttonText: "Sign Up",
//   features: [
//     "Low cost",
//     "Credit resets daily",
//     "Multiple subscriptions available",
//     "Best for daily needs",
//   ],
// };
const planSchema = new mongoose.Schema(
  {
    planType: String,
    day: Number,
    currency: String,
    volumes: [
      {
        totalCredits: Number,
        price: Number,
      },
    ],
    type: String,
    payment: String,
    description: String,
    question: String,
    volumePrompt: String,
    customVolumePrompt: String,
    features: Array,
  },
  { timestamps: true }
);

const Plan = mongoose.model("plans", planSchema);
module.exports = Plan;
