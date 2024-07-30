require("dotenv").config();
const { default: axios } = require("axios");
const User = require("../models/userModel");
const { resReturn, tokenCreate, sendMail } = require("../utils/utils");
const bcrypt = require("bcrypt");
const moment = require("moment");
const UserIp = require("../models/IpModel");
const Plan = require("../models/PricingModel");
const Api = require("../models/ApiModel");
const Payment = require("../models/PaymentModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Binance = require("node-binance-api");
const Maintenance = require("../models/MaintananceModel");

const clientUrl =
  process.env.server === "prod"
    ? process.env.clientWebUrl
    : "http://localhost:5173";
    

class user {

  create = async (req, res) => {
    try {
      const find = await Maintenance.findOne({ status: "open" });
      if (find)
        return resReturn(res, 222, { err: "already running a maintenance" });

      const maintenance = await Maintenance.create({
        status: "open",
      });
      res.status(201).json({ msg: "created success", maintenance });
    } catch (error) {
      res.status(222).json({ message: error.message });
    }
  };

  remove = async (req, res) => {
    try {
      const find = await Maintenance.findOne({ status: "open" });
      if (!find) return resReturn(res, 222, { err: "maintenance not found" });

      const update = await Maintenance.findByIdAndUpdate(
        find?._id,
        { status: "closed" },
        { new: true }
      );
      return resReturn(res, 200, { msg: " updated successfully", update });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  checking = async (req, res) => {
    try {
      const find = await Maintenance.findOne({ status: "open" });
      if (find) {
        return resReturn(res, 200, {
          msg: "have maintenance",
          maintenance: find,
        });
      }
      resReturn(res, 222, { msg: "not have maintenance" });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  getAll = async (req, res) => {
    try {
      const maintenances = await Maintenance.find({});
      resReturn(res, 200, { msg: "all maintenance", maintenances });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  // todo : remove top all

  authByIp = async (req, res) => {
    try {
      const {
        data: { ip },
      } = await axios.get("https://jsonip.com");

      let userIp;
      userIp = await UserIp.findOne({ ip });
      if (!userIp) {
        userIp = await UserIp.create({ ip });
      }
      resReturn(res, 200, { userIp: userIp });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  auth = async (req, res) => {
    try {
      const { _id } = req.user;
      const user = await User.findById(_id).select("-password");
      if (!user) return resReturn(res, 222, { err: "user not found" });
      const currentDate = moment().format("YYYY-MM-DD");

      const findH = await User.findOne({
        _id,
        "apiUsageHistory.Date": currentDate,
      });
      if (findH) {
        await User.updateOne(
          { _id, "apiUsageHistory.Date": currentDate },
          {
            $set: {
              "apiUsageHistory.$.deliverable": user.deliverable,
              "apiUsageHistory.$.invalid": user.invalid,
              "apiUsageHistory.$.apiUsage": user.apiUsage,
              "apiUsageHistory.$.Date": currentDate,
            },
          },
          { new: true }
        );
      } else {
        await User.updateOne(
          { _id },
          {
            $push: {
              apiUsageHistory: {
                Date: currentDate,
                deliverable: user?.deliverable || 0,
                invalid: user?.invalid || 0,
                apiUsage: user?.apiUsage || 0,
              },
            },
          },
          { new: true }
        );
      }

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
          if (user.subTotalCredit < user.subPerDayCredit) {
            const updatedUser = await User.findByIdAndUpdate(
              _id,
              {
                subLastDate: currentDate,
                credit: user.credit + user.subTotalCredit,
                subTotalCredit: 0,
              },
              { new: true }
            );

            return resReturn(res, 200, {
              msg: "credit and date ended.",
              user: updatedUser,
            });
          } else {
            const updatedUser = await User.findByIdAndUpdate(
              _id,
              {
                subLastDate: currentDate,
                credit: user.credit + user.subPerDayCredit,
                subTotalCredit: user.subTotalCredit - user.subPerDayCredit,
              },
              { new: true }
            );

            return resReturn(res, 200, {
              msg: "credit and date updated",
              user: updatedUser,
            });
          }
        }
      }
      return resReturn(res, 200, { msg: "default user", user });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  register = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const { data } = await axios.get("https://jsonip.com");
      const ip = data?.ip;
      if (!ip) return resReturn(res, 222, { err: "ip not found" });

      const ipFind = await User.findOne({ ip });
      if (ipFind)
        return resReturn(res, 222, { err: "this ip user already registered" });

      const find = await User.findOne({ email });
      if (find) return resReturn(res, 222, { err: "user already registered" });

      // const userIp = await UserIp.findOne({ ip });
      // if (!userIp)
      //   return resReturn(res, 222, { err: "user ip not registered" });

      const bcryptPass = bcrypt.hashSync(password, 10);
      const gmailAuthToken = await jwt.sign({ email }, process.env.jwt_secret, {
        expiresIn: "15m",
      });

      const link = `${clientUrl}/email-validation/${gmailAuthToken}`;
      const mailData = await sendMail("verify", email, name, link);

      if (mailData.status === true) {
        await User.create({
          name,
          email,
          password: bcryptPass,
          ip,
        });

        return res.status(201).send(mailData);
      }
    } catch (error) {
      console.log(error.message);
    }
  };


  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const find = await User.findOne({ email });
      if (!find)
        return resReturn(res, 222, {
          err: "user not found",
        });

      if (!bcrypt.compareSync(password, find.password))
        return resReturn(res, 222, { err: "password not match" });

      if (find.isVerify === false)
        return resReturn(res, 204, {
          err: "user not verified ....",
        });

      if (find.twoFectorAuthSave === false) {
        return resReturn(res, 224, { err: "need Two Fector Authentication!" });
      }

      const token = await tokenCreate({
        _id: find._id,
        role: find.role,
        email: find.email,
      });
      resReturn(res, 201, { msg: "login success", user: find, token });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  googleLogin = async (req, res) => {
    try {
      const { name, email } = req.body;
      const find = await User.findOne({
        email,
        password: { $ne: "googleHasNoPassword" },
      });

      if (find)
        return resReturn(res, 223, { err: "this email already logined." });

      const googleFind = await User.findOne({
        email,
        password: "googleHasNoPassword",
      });
      if (!googleFind) {
        const newUser = await User.create({
          email,
          name,
        });
        const token = await tokenCreate({
          _id: newUser._id,
          role: newUser.role,
          email: newUser.email,
        });
        return resReturn(res, 201, {
          msg: "register success",
          user: newUser,
          token,
        });
      }

      const token = await tokenCreate({
        _id: googleFind._id,
        role: googleFind.role,
        email: googleFind.email,
      });
      resReturn(res, 201, { msg: "login success", user: googleFind, token });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  updatePassword = async (req, res) => {
    try {
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
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  updateProfile = async (req, res) => {
    try {
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
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };


}

module.exports = new user();
