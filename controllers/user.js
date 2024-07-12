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

const clientUrl =
  process.env.server === "prod"
    ? process.env.clientWebUrl
    : "http://localhost:5173";

const binance = new Binance().options({
  APIKEY: "zsjdb33y8rd5rvcrniyxa5d7kem6wbjp8snkzxkoud3umkgfmoaiuuqxafn4ybdu",
  APISECRET: "qn4anaap8eu1um4pulslczjimcsaou5oyxcdskujzsk1uolzt5yhsiycnsgnyrlb",
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
});

class user {
  sendOTP = async (req, res) => {
    try {
      const { email } = req.params;
      if (!email) return resReturn(res, 222, { err: "Invalid email" });
      let otp = "";
      for (let i = 0; i < 6; i++) {
        otp += Math.round(Math.random() * 9);
      }
      const secret = `${process.env.jwt_secret}`;
      const tokenTwoFA = await jwt.sign({ email, otp }, secret, {
        expiresIn: "15m",
      });
      const find = await User.findOne({ email });
      if (!find) return resReturn(res, 222, { err: "user not found" });

      await sendMail("twoFector", email, find?.name || "John", otp);

      resReturn(res, 200, { tokenTwoFA });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  verifyOTP = async (req, res) => {
    try {
      const { email, otp, tokenTwoFA, twoFectorAuthSave } = req.body;
      const find = await User.findOne({ email });
      if (!find)
        return resReturn(res, 222, { err: "user not exist with this email" });
      if (!otp || otp.length < 6)
        return resReturn(res, 222, { err: "user not exist with this email" });

      const secret = `${process.env.jwt_secret}`;
      await jwt.verify(tokenTwoFA, secret, async (err, verifiedJwt) => {
        if (err) return resReturn(res, 222, { err: err.message });
        if (otp !== verifiedJwt.otp)
          return resReturn(res, 222, { err: "otp not valid" });
        if (twoFectorAuthSave) {
          await User.updateOne(
            { email: verifiedJwt.email },
            { twoFectorAuthSave: true }
          );
        }
        const find = await User.findOne({ email: verifiedJwt.email });
        const token = await tokenCreate({
          _id: find._id,
          role: find.role,
          email: find.email,
        });
        resReturn(res, 201, {
          msg: "two fector auth succesed.",
          user: find,
          token,
        });
      });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  verifyMailSent = async (req, res) => {
    try {
      const { email } = req.body;
      const find = await User.findOne({ email });
      if (!find)
        return resReturn(res, 222, { err: "user not exist with this email" });

      const gmailAuthToken = await jwt.sign({ email }, process.env.jwt_secret, {
        expiresIn: "2m",
      });

      const link = `${clientUrl}/email-validation/${gmailAuthToken}`;
      const mailData = await sendMail(
        "verify",
        email,
        find?.name || "John",
        link
      );

      if (mailData.status === true) {
        return res.status(201).send(mailData);
      }
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  mailSent = async (req, res) => {
    try {
      const { email } = req.body;
      const find = await User.findOne({ email });
      if (!find)
        return resReturn(res, 222, { err: "user not exist with this email" });

      const newSecret = `${process.env.jwt_secret}${find.password}`;
      const token = await jwt.sign({ _id: find._id }, newSecret, {
        expiresIn: "3m",
      });

      const link = `${clientUrl}/forget-password/${find.email}/${token}`;

      const mailData = await sendMail("forget", email, find?.name, link);

      if (mailData.status === true) {
        return res.status(201).send(mailData);
      }
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  contactUSMail = async (req, res) => {
    try {
      const { name, email, body } = req.body;
      const newBody = `<p>Name: ${name}  </p> <p>Email: ${email}</p> <p>Message: ${body}</p>`;

      const mailData = await sendMail(
        "support",
        "mdatick866@gmail.com",
        name,
        newBody
      );

      if (mailData.status === true) {
        res.status(201).send({ msg: "Thanks for sending your opinion.❤️" });
      }
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  forgetPassword = async (req, res) => {
    const { token } = req.params;

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return resReturn(res, 222, { err: "user not exist." });
    const newSecret = `${process.env.jwt_secret}${user.password}`;

    await jwt.verify(token, newSecret, async (err, verifiedJwt) => {
      if (err) {
        if (err.message === "invalid signature")
          return resReturn(res, 223, { err: "Already Changed Password" });

        return resReturn(res, 223, { err: err.message });
      }
      const { _id } = verifiedJwt;
      const bcryptPassword = bcrypt.hashSync(password, 10);
      const updateUser = await User.findByIdAndUpdate(
        _id,
        { password: bcryptPassword },
        { new: true }
      );

      resReturn(res, 201, {
        msg: "user forget password successfully",
        user: updateUser,
      });
    });
  };

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

  getApis = async (req, res) => {
    try {
      const { _id } = req.user;

      const allApi = await Api.find({ userId: _id });
      resReturn(res, 200, { msg: "api all get", allApi });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  createApi = async (req, res) => {
    try {
      const { apiName } = req.body;
      const { _id } = req.user;

      const newApi = await Api.create({
        userId: _id,
        apiName,
      });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }

    resReturn(res, 201, { msg: "api created", newApi });
  };

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

  createPlan = async (req, res) => {
    try {
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
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  createVolumes = async (req, res) => {
    try {
      const { totalCredits, price, planId } = req.body;

      const plan = await Plan.findById(planId);
      if (!plan) return resReturn(res, 202, { err: "plan not found" });

      const updatedPlan = await Plan.findByIdAndUpdate(
        planId,
        { $push: { volumes: { totalCredits, price } } },
        { new: true }
      );
    } catch (error) {
      resReturn(res, 222, { err: "error creating volume" });
    }
  };

  getPlan = async (req, res) => {
    try {
      const plans = await Plan.find({});
      resReturn(res, 200, { msg: "plan all get", plans });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

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

  block = async (req, res) => {
    try {
      const _id = req.params._id;
      const admin = await User.findById(req.user._id);
      if (!admin || admin?.role === "user")
        return resReturn(res, 222, { err: "only admin can block user." });

      const user = await User.findById(_id);
      const updatedUser = await User.findByIdAndUpdate(
        _id,
        { block: !user.block },
        { new: true }
      );

      return resReturn(res, 200, { msg: "user ban unban", updatedUser });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  addUser = async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const find = await User.findOne({ email });
      if (find) return resReturn(res, 222, { err: "user already created." });

      const user = await User.create({
        name,
        email,
        password: bcrypt.hashSync(password, 10),
      });

      resReturn(res, 201, { msg: "user created by admin", user });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  totalMailCheck = async (req, res) => {
    try {
      const users = await User.find({});
      let totalMailCheck = 0;
      users.map(
        (u) =>
          (totalMailCheck +=
            Number(u?.deliverable || 0) +
            Number(u?.invalid || 0) +
            Number(u?.apiUsage || 0))
      );
      res.status(200).send({ msg: "mail check total", totalMailCheck });
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

  emailAuthCheck = async (req, res) => {
    try {
      const { token } = req.params;
      if (!token || token === "null")
        return resReturn(res, 222, { err: "token not provided." });

      await jwt.verify(
        token,
        process.env.jwt_secret,
        async (err, verifiedJwt) => {
          if (err) return resReturn(res, 223, { err: err.message });
          const { data } = await axios.get("https://jsonip.com");
          const ip = data.ip;
          const { email } = verifiedJwt;
          const find = await User.findOne({ email });
          if (!find) return resReturn(res, 222, { err: "user not found." });
          const findVerify = await User.findOne({ email, isVerify: true });
          if (findVerify)
            return resReturn(res, 222, {
              err: "you already veirfy this user.",
            });

          const user = await User.findOneAndUpdate(
            { email },
            { isVerify: true },
            { new: true }
          );

          const token = await tokenCreate({
            _id: user._id,
            role: user.role,
            email: user.email,
          });

          resReturn(res, 200, {
            msg: "user verified successfully",
            token,
            user,
          });
        }
      );
    } catch (error) {
      resReturn(res, 222, { err: error.message });
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

  updatePass = async (req, res) => {
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

  getMany = async (req, res) => {
    try {
      const { search, page, limit } = req.query;
      const { role, _id } = req.user;
      if (role === "user")
        return resReturn(res, 222, { err: "only admin allowed." });

      const pageNumber = parseInt(page) || 10;
      const limitNumber = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      // Create a filter for the search query
      const filter = search
        ? {
            _id: { $ne: _id },
            name: { $regex: search, $options: "i" },
          }
        : { _id: { $ne: _id } };

      const count = await User.countDocuments(filter);
      // Fetch the users from the database
      const users = await User.find(filter).skip(skip).limit(limitNumber);
      resReturn(res, 200, { users, count });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  deleteMany = async (req, res) => {
    try {
      const users = await User.deleteMany();
      resReturn(res, 200, { users });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  adjustUser = async (req, res) => {
    try {
      const { _id } = req.params;
      const { limit } = req.body;
      if (!_id) return resReturn(res, 222, { err: "id not found" });

      const find = await User.findById(_id);
      if (!find) return resReturn(res, 222, { err: "user not found" });

      const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
          subscription: false,
          credit: limit,
          subPerDayCredit: 0,
          subLastDate: "",
          subEndDate: "",
        },
        { new: true }
      );

      resReturn(res, 201, { msg: "Success", user: updatedUser });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };
}

module.exports = new user();
