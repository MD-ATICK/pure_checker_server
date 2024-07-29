require("dotenv").config();
const Payment = require("../models/PaymentModel");
const { resReturn } = require("../utils/utils");

class paymentController {
  getPayments = async (req, res) => {
    try {
      const { _id } = req.user;

      const payments = await Payment.find({ userId: _id });
      resReturn(res, 200, { msg: "payment all get", payments });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  getAllPayments = async (req, res) => {
    try {
      const { page } = req.query;
      const count = await Payment.countDocuments({});

      const payments = await Payment.find({})
        .populate("userId")
        .skip((page - 1) * 10)
        .limit(10);

      resReturn(res, 200, { msg: "payment all get", payments, count });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };
}

module.exports = new paymentController();
