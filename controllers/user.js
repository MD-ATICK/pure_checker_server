const { default: axios } = require("axios");
const User = require("../models/userModel");
const { resReturn, tokenCreate } = require("../utils/utils");
const bcrypt = require("bcrypt");
const moment = require("moment");
const UserIp = require("../models/IpModel");
const Plan = require("../models/PricingModel");
const Api = require("../models/ApiModel");
const Payment = require("../models/PaymentModel");

class user {

  getPayments = async (req, res) => {
    const { _id } = req.user;

    const payments = await Payment.find({userId : _id})
    resReturn(res, 200 , { msg : 'payment all get' , payments})
  }

  getApis = async (req, res) => {
    const { _id } = req.user;

    const allApi = await Api.find({ userId: _id });
    resReturn(res, 200, { msg: "api all get", allApi });
  };

  createApi = async (req, res) => {
    const { apiName } = req.body;
    const { _id } = req.user;
    console.log("api create", apiName, _id);

    const newApi = await Api.create({
      userId: _id,
      apiName,
    });

    resReturn(res, 201, { msg: "api created", newApi });
  };

  buyPlan = async (req, res) => {
    const { _id } = req.user;
    const { price, planType, dayLimit, credit, currency } = req.body;
    let user;
    console.log(req.body);
    user = await User.findById(_id);

    if (user.subscription === true)
      return resReturn(res, 222, { err: "already running subscription" });

    if (planType === "subscription") {
      const perDay = Math.floor(credit / 30);
      user = await User.findByIdAndUpdate(
        _id,
        {
          subscription: true,
          credit: Number(user.credit) + Number(perDay),
          subPerDayCredit: perDay,
          subLastDate: moment().format("YYYY-MM-DD"),
          subEndDate: moment().add(dayLimit, "days").format("YYYY-MM-DD"),
        },
        { new: true }
      );
    } else if (planType === "payAsGo") {
      user = await User.findByIdAndUpdate(
        _id,
        {
          credit: Number(user.credit) + Number(credit),
          payAsGo: true,
          subPerDayCredit: 0,
          subLastDate: "",
          subEndDate: "",
        },
        { new: true }
      );
    }

    const payment = await Payment.create({
      planType,
      price,
      dayLimit,
      currency,
      credit,
      userId : _id
    });

    resReturn(res, 201, { msg: "buy plan" + planType, user, payment });
  };

  subscription = async (req, res) => {
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
  };

  createPlan = async (req, res) => {
    const {
      planType,
      day,
      currency,
      volumes,
      type,
      payment,
      description,
      question,
      volumePrompt,
      customVolumePrompt,
      features,
    } = req.body;

    console.log(req.body);

    if (planType === "subscription") {
      const newPlan = await Plan.create({
        planType,
        day,
        currency,
        volumes,
        type,
        payment,
        description,
        question,
        volumePrompt,
        customVolumePrompt,
        features,
      });

      resReturn(res, 201, { msg: "plan subscription created", newPlan });
    } else if (planType === "payAsGo") {
      const newPlan = await Plan.create({
        planType,
        day,
        currency,
        volumes,
        type,
        payment,
        description,
        question,
        volumePrompt,
        customVolumePrompt,
        features,
      });
      resReturn(res, 201, { msg: "plan payAsGo created", newPlan });
    }
  };

  getPlan = async (req, res) => {
    try {
      const plans = await Plan.find({});
      resReturn(res, 200, { msg: "plan all get", plans });
    } catch (error) {
      console.log(error.message);
    }
  };

  ip = async (req, res) => {
    const {
      data: { ip },
    } = await axios.get("https://jsonip.com");

    let userIp;
    userIp = await UserIp.findOne({ ip });
    if (!userIp) {
      userIp = await UserIp.create({ ip });
    }
    resReturn(res, 200, { userIp: userIp });
  };

  block = async (req, res) => {
    const _id = req.params._id;
    const user = req.user;
    if (user.role === "admin")
      return resReturn(res, 222, { err: "only admin can block user." });
    
    const userFind = await User.findById(_id);
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { block: !userFind.block },
      { new: true }
    );

    return resReturn(res, 200, { msg: "user Blocked", updatedUser });
  };

  auth = async (req, res) => {
    const { _id } = req.user;
    const user = await User.findById(_id).select("-password");
    console.count(user);
    if (!user) return resReturn(res, 222, { err: "user not found" });
    const currentDate = moment().format("YYYY-MM-DD");
    if (user.subscription === true) {
      if (user.subLastDate === user.subEndDate) {
        const updatedUser = await User.findByIdAndUpdate(
          _id,
          {
            subscription: false,
            credit: 0,
            subLastDate: "",
            subEndDate: "",
            subPerDayCredit: 0,
          },
          { new: true }
        );
        return resReturn(res, 200, {
          msg: "subscription ended",
          user: updatedUser,
        });
      } else if (currentDate !== user.subLastDate) {
        const updatedUser = await User.findByIdAndUpdate(
          _id,
          {
            subLastDate: currentDate,
            credit: user.subPerDayCredit,
          },
          { new: true }
        );

        return resReturn(res, 200, {
          msg: "credit and date updated",
          user: updatedUser,
        });
      }
    }

    return resReturn(res, 200, { msg: "default user", user });
  };

  register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const { data } = await axios.get("https://jsonip.com");
      const ip = data.ip;
      if (!ip) return resReturn(res, 222, { err: "ip not found" });

      const ipFind = await User.findOne({ ip });
      if (ipFind)
        return resReturn(res, 222, { err: "this ip already registered" });

      const find = await User.findOne({ email });
      if (find) return resReturn(res, 222, { err: "user already registered" });

      const userIp = await UserIp.findOne({ ip });
      if (!userIp)
        return resReturn(res, 222, { err: "user ip not registered" });

      const user = await User.create({
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        ip,
      });

      const token = await tokenCreate({
        _id: user._id,
        role: user.role,
        email: user.email,
        subscription: user.subscription,
        credit: user.credit,
        payAsGo: user.payAsGo,
      });

      resReturn(res, 201, { msg: "user created", user, token });
    } catch (error) {
      console.log(error.message);
    }
  };

  login = async (req, res) => {
    const { email, password } = req.body;
    const find = await User.findOne({ email });
    if (!find)
      return resReturn(res, 222, {
        err: "user not found",
      });

    if (!bcrypt.compareSync(password, find.password))
      return resReturn(res, 222, { err: "password not match" });
    const token = await tokenCreate({
      _id: find._id,
      role: find.role,
      email: find.email,
      subscription: find.subscription,
      credit: find.credit,
      payAsGo: find.payAsGo,
    });
    resReturn(res, 201, { msg: "login success", user: find, token });
  };

  updatePass = async (req, res) => {
    const { password } = req.body;
    const { _id } = req.user;
    await User.findByIdAndUpdate(
      _id,
      {
        password: bcrypt.hashSync(password, 10),
      },
      { new: true }
    );

    resReturn(res, 202, { msg: "update password successfully." });
  };

  updateProfile = async (req, res) => {
    const { name, email, country, address, zipCode, mobileNumber, city } =
      req.body;
    const { _id } = req.user;

    const user = await User.findByIdAndUpdate(
      _id,
      {
        name,
        email,
        country,
        address,
        zipCode,
        mobileNumber,
        city,
      },
      { new: true }
    );

    resReturn(res, 202, { msg: "user profile updated", user });
  };

  getMany = async (req, res) => {
    const { role, _id } = req.user;
    if (role === "admin")
      return resReturn(res, 222, { err: "only admin can block user." });
    const g = await User.find().select("-password");
    // const users = g.filter((user) => String(user._id) !== String(_id));
    resReturn(res, 200, { users : g });
  };

  deleteMany = async (req, res) => {
    const users = await User.deleteMany();
    resReturn(res, 200, { users });
  };
}

module.exports = new user();
