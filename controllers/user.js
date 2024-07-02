require("dotenv").config();
const { default: axios } = require("axios");
const User = require("../models/userModel");
const {
  resReturn,
  tokenCreate,
  sendMail,
  clientUrl,
} = require("../utils/utils");
const bcrypt = require("bcrypt");
const moment = require("moment");
const UserIp = require("../models/IpModel");
const Plan = require("../models/PricingModel");
const Api = require("../models/ApiModel");
const Payment = require("../models/PaymentModel");
const jwt = require("jsonwebtoken");

const Binance = require("node-binance-api");

const binance = new Binance().options({
  APIKEY: "zsjdb33y8rd5rvcrniyxa5d7kem6wbjp8snkzxkoud3umkgfmoaiuuqxafn4ybdu",
  APISECRET: "qn4anaap8eu1um4pulslczjimcsaou5oyxcdskujzsk1uolzt5yhsiycnsgnyrlb",
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
});

class user {
  binanceOrder = async (req, res) => {
    const { symbol, quantity, price } = req.body;

    await binance
      .order({
        symbol: symbol,
        side: "BUY",
        type: "LIMIT",
        quantity: quantity,
        price: price,
      })
      .then((order) => {
        res.status(201).json(order);
      })
      .catch((error) => {
        res.status(500).json({ error: error.message });
      });
  };

  verifyMailSent = async (req, res) => {
    const { email } = req.body;
    const find = await User.findOne({ email });
    if (!find)
      return resReturn(res, 222, { err: "user not exist with this email" });

    console.log("emailvlaid", find);
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
  };

  mailSent = async (req, res) => {
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
  };

  contactUSMail = async (req, res) => {
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
      // const { data } = await axios.get("https://jsonip.com");
      // const ip = data.ip;
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
    const { _id } = req.user;

    const payments = await Payment.find({ userId: _id });
    resReturn(res, 200, { msg: "payment all get", payments });
  };

  getAllPayments = async (req, res) => {
    const payments = await Payment.find({});
    resReturn(res, 200, { msg: "payment all get", payments });
  };

  getApis = async (req, res) => {
    const { _id } = req.user;

    const allApi = await Api.find({ userId: _id });
    resReturn(res, 200, { msg: "api all get", allApi });
  };

  createApi = async (req, res) => {
    const { apiName } = req.body;
    const { _id } = req.user;

    const newApi = await Api.create({
      userId: _id,
      apiName,
    });

    resReturn(res, 201, { msg: "api created", newApi });
  };

  buyPlan = async (req, res) => {
    const { _id } = req.user;
    const { price, planType, totalCredits } = req.body;
    let user;
    user = await User.findById(_id);

    if (user.subscription === true)
      return resReturn(res, 222, { err: "already running subscription" });

    if (planType === "subscription") {
      const perDay = Math.floor(totalCredits / 30);
      user = await User.findByIdAndUpdate(
        _id,
        {
          subscription: true,
          credit: Number(user.credit) + Number(perDay),
          subPerDayCredit: perDay,
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
    // const user = req.user;
    // if (user.role === "admin")
    //   return resReturn(res, 222, { err: "only admin can block user." });

    const userFind = await User.findById(_id);
    if (!userFind) return resReturn(res, 222, { err: "user not found." });

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { block: !userFind.block },
      { new: true }
    );

    return resReturn(res, 200, { msg: "user ban unban", updatedUser });
  };

  addUser = async (req, res) => {
    const { name, email, password } = req.body;

    const find = await User.findOne({ email });
    if (find) return resReturn(res, 222, { err: "user already created." });

    const user = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, 10),
    });

    resReturn(res, 201, { msg: "user created by admin", user });
  };

  totalMailCheck = async (req, res) => {
    // deliverable: Number,
    // invalid: Number,
    // apiUsage: Number,
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
  };

  auth = async (req, res) => {
    const { _id } = req.user;
    const user = await User.findById(_id).select("-password");
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

      // const ipFind = await User.findOne({ ip });
      // if (ipFind)
      //   return resReturn(res, 222, { err: "this ip already registered" });

      const find = await User.findOne({ email });
      if (find) return resReturn(res, 222, { err: "user already registered" });

      const userIp = await UserIp.findOne({ ip });
      if (!userIp)
        return resReturn(res, 222, { err: "user ip not registered" });

      const bcryptPass = bcrypt.hashSync(password, 10);

      const gmailAuthToken = await jwt.sign({ email }, process.env.jwt_secret, {
        expiresIn: "2m",
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
      // const user = await User.create({
      //   name,
      //   email,
      //   password: bcrypt.hashSync(password, 10),
      //   ip,
      // });

      // const token = await tokenCreate({
      //   _id: user._id,
      //   role: user.role,
      //   email: user.email,
      //   subscription: user.subscription,
      //   credit: user.credit,
      //   payAsGo: user.payAsGo,
      // });

      // resReturn(res, 201, { msg: "user created", user, token });
    } catch (error) {
      console.log(error.message);
    }
  };

  emailAuthCheck = async (req, res) => {
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
          return resReturn(res, 222, { err: "you already veirfy this user." });

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

        resReturn(res, 200, { msg: "user verified successfully", token, user });
      }
    );
  };

  login = async (req, res) => {
    const { email, password } = req.body;
    const find = await User.findOne({ email });
    if (!find)
      return resReturn(res, 222, {
        err: "user not found",
      });

    const userVerify = await User.findOne({ email, isVerify: false });
    if (userVerify)
      return resReturn(res, 204, {
        err: "user not verified ....",
      });

    if (!bcrypt.compareSync(password, find.password))
      return resReturn(res, 222, { err: "password not match" });
    const token = await tokenCreate({
      _id: find._id,
      role: find.role,
      email: find.email,
    });
    resReturn(res, 201, { msg: "login success", user: find, token });
  };

  googleLogin = async (req, res) => {
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
    const g = await User.find({ _id: { $ne: _id } }).select("-password");
    // const users = g.filter((user) => String(user._id) !== String(_id));
    resReturn(res, 200, { users: g });
  };

  deleteMany = async (req, res) => {
    const users = await User.deleteMany();
    resReturn(res, 200, { users });
  };

  adjustUser = async (req, res) => {
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
  };

  // end
}

module.exports = new user();
