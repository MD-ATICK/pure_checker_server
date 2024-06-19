const { default: mongoose, Mongoose } = require("mongoose");

const userIpSchema = new mongoose.Schema(
  {
    ip: String,
    freeCredit: { type: Number, default: 100 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true }
);

const UserIp = mongoose.model("userIps", userIpSchema);
module.exports = UserIp;
