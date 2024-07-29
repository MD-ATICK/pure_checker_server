const Payment = require('../models/PaymentModel');
const User = require('../models/userModel');
const { resReturn } = require('../utils/utils');
const moment = require('moment')

require('dotenv').config()

class planController {

  buyPlan = async (req, res) => {
    try {
      const { _id } = req.user;
      const { price, planType, totalCredits, perDay } = req.body;
      let user;
      user = await User.findById(_id);

      if (user.subscription === true)
        return resReturn(res, 222, { err: "already running subscription" });
      if (planType === "subscription") {
        user = await User.findByIdAndUpdate(
          _id,
          {
            subscription: true,
            credit: Number(user.credit) + Number(perDay),
            subPerDayCredit: perDay,
            subTotalCredit: totalCredits,
            subLastDate: moment().format("YYYY-MM-DD"),
            subEndDate: moment().add(30, "days").format("YYYY-MM-DD"),
          },
          { new: true }
        );
      } else if (planType === "payAsGo") {
        user = await User.findByIdAndUpdate(
          _id,
          {
            credit: Number(user.credit) + Number(totalCredits),
            payAsGo: true,
            subscription: false,
            subPerDayCredit: 0,
            subTotalCredit: 0,
            subLastDate: "",
            subEndDate: "",
          },
          { new: true }
        );
      }

      const payment = await Payment.create({
        planType,
        price,
        dayLimit: planType === "subscription" ? 30 : 365,
        currency: "USD",
        credit: totalCredits,
        userId: _id,
      });

      resReturn(res, 201, { msg: "buy plan" + planType, user, payment });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  subscription = async (req, res) => {
    try {
      const { _id } = req.user;
      const user = await User.findByIdAndUpdate(
        _id,
        {
          subscription: true,
          credit: 2500,
          subLastDate: moment().format("YYYY-MM-DD"),
          subEndDate: moment().add(30, "days").format("YYYY-MM-DD"),
        },
        { new: true }
      );
      return resReturn(res, 200, { msg: "subscription started", user });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

}

module.exports = new planController()