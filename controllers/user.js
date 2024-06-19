const { default: axios } = require("axios");
const User = require("../models/userModel");
const { resReturn, tokenCreate } = require("../utils/utils");
const bcrypt = require("bcrypt");
const moment = require("moment");
const UserIp = require("../models/IpModel");
const Plan = require("../models/PricingModel");

class user {
  buyPlan = async (req, res) => {
    const { _id } = req.user;
    const { price, isType, dayFor, credit } = req.body;
    let user;
    user = await User.findById(_id);
    if (isType === "subscription" && user.subscription === false) {
      user = await User.findByIdAndUpdate(
        _id,
        {
          subscription: true,
          perDayCredit: credit,
          credit: Number(user.credit) + Number(credit),
          lastDate: moment().format("YYYY-MM-DD"),
          endDate: moment().add(dayFor, "days").format("YYYY-MM-DD"),
        },
        { new: true }
      );
    } else if (isType === "payAsGo") {
      user = await User.findByIdAndUpdate(
        _id,
        {
          credit: Number(user.credit) + Number(credit),
          payAsGo: true,
        },
        { new: true }
      );
    }

    resReturn(res, 201, { msg: "buy plan" + isType, user });
  };

  subscription = async (req, res) => {
    const { _id } = req.user;
    const user = await User.findByIdAndUpdate(
      _id,
      {
        subscription: true,
        credit: 2500,
        lastDate: moment().format("YYYY-MM-DD"),
        endDate: moment().add(30, "days").format("YYYY-MM-DD"),
      },
      { new: true }
    );
    return resReturn(res, 200, { msg: "subscription started", user });
  };

  createPlan = async (req, res) => {
    const { _id } = req.user;
    const { price, dayFor, isType, credit } = req.body;

    let plan;

    if (isType === "payAsGo") {
      plan = await Plan.create({
        price,
        dayFor: 365,
        isType,
        credit,
      });
    } else if (isType === "subscription") {
      plan = await Plan.create({
        price,
        dayFor,
        isType,
        credit,
      });
    }

    resReturn(res, 201, { msg: "plan created" + plan.isType, plan });
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
    if (user.role !== "admin")
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
      if (user.lastDate === user.endDate) {
        const updatedUser = await User.findByIdAndUpdate(
          _id,
          {
            subscription: false,
            credit: 0,
            lastDate: "",
            endDate: "",
            perDayCredit: 0,
          },
          { new: true }
        );
        return resReturn(res, 200, {
          msg: "subscription ended",
          user: updatedUser,
        });
      } else if (currentDate !== user.lastDate) {
        const updatedUser = await User.findByIdAndUpdate(
          _id,
          {
            lastDate: currentDate,
            credit: user.perDayCredit,
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
    const user = await User.findByIdAndUpdate(
      req.id,
      {
        password: bcrypt.hashSync(password, 10),
      },
      { new: true }
    );

    resReturn(res, 202, { msg: "updated", user });
  };

  getMany = async (req, res) => {
    const { role, _id } = req.user;
    if (role !== "admin")
      return resReturn(res, 222, { err: "only admin can block user." });
    const g = await User.find().select("-password");
    const users = g.filter((user) => String(user._id) !== String(_id));
    resReturn(res, 200, { users });
  };

  deleteMany = async (req, res) => {
    const users = await User.deleteMany();
    resReturn(res, 200, { users });
  };
}

module.exports = new user();
