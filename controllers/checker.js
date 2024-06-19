require("dotenv").config();
const { default: axios } = require("axios");
const User = require("../models/userModel");
const { resReturn, userAuthorize } = require("../utils/utils");
const emailValidator = require("deep-email-validator");
const UserIp = require("../models/IpModel");
const jwt = require("jsonwebtoken");
class checker {
  gmailCheck = async (req, res, next) => {
    try {
      const { email } = req.query;
      const bearerToken = req.headers.authorization;
      const token = bearerToken.split(" ")[1];
      const data = await emailValidator.validate(email);
      console.log(typeof token);
      if (token === "null") {
        console.log("1");
        const x = await axios.get("https://jsonip.com");
        const ip = x.data.ip;
        const userIp = await UserIp.findOneAndUpdate(
          { ip },
          { $inc: { freeCredit: -1 } },
          { new: true }
        );
        console.log(userIp);
        resReturn(res, 200, {
          data: { ...data, email },
          userIp,
          user: "default",
        });
      } else if (token !== "null") {
        console.log("3");
        await jwt.verify(
          token,
          process.env.jwt_secret,
          async (err, verifiedJwt) => {
            if (err) return resReturn(res, 223, { err: err.message });
            const find = await User.findByIdAndUpdate(
              verifiedJwt._id,
              { $inc: { credit: -1 } },
              { new: true }
            );
            resReturn(res, 200, {
              data: { ...data, email },
              user: find,
              user: "login",
            });
          }
        );
      }
    } catch (error) {
      console.log(error.message);
      res.status(222).send(error.message);
    }
  };

  bulksCheck = async (req, res) => {
    const { bulks } = req.body;
    const { _id } = req.user;
    let result = [];

    const user = await User.findById(_id);
    console.log(user);
    if (user.subscription === true || user.payAsGo === true) {
      if (user.credit >= bulks.length) {
        for (const email of bulks) {
          const data = await emailValidator.validate(email);
          result = [...result, { email, ...data }];
          await User.findByIdAndUpdate(
            _id,
            { $inc: { credit: -1 } },
            { new: true }
          );
        }
        const newFind = await User.findById(_id);
        return resReturn(res, 201, { result, user: newFind });
      }
      return resReturn(res, 222, { err: "have not credit." });
    }
    resReturn(res, 222, { err: "subscription not running." });
  };

  singleEmailApi = async (req, res) => {
    const { key, gmail } = req.query;
    console.log(key);
    try {
      const user = await User.findById(key);
      if (!user)
        return resReturn(res, 222, { err: "s: api check: user not found" });

      if (user.subscription === false || user.payAsGo === false)
        return resReturn(res, 222, { err: " subscription ended." });

      if (user.credit === 0)
        return resReturn(res, 222, { err: " credit ended. buy a plan now" });

      const data = await emailValidator.validate(gmail);
      const updatedUser = await User.findByIdAndUpdate(
        key,
        { $inc: { credit: -1 } },
        { new: true }
      );
      resReturn(res, 200, { data: { ...data, gmail } });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  bulkEmailApi = async (req, res) => {
    const { key } = req.query;
    const bulks = req.body;
    console.log(key)
    try {
      const user = await User.findById(key);
      let result = [];
      let updatedUser;
      if (!user)
        return resReturn(res, 222, { err: "s: api check: user not found" });

      if (user.subscription === false || user.payAsGo === false)
        return resReturn(res, 222, { err: " subscription ended." });

      if (user.credit >= bulks.length) {
        for (const email of bulks) {
          const data = emailValidator.validate(email);
          result = [...result, { email, ...data }];
          updatedUser = await User.findByIdAndUpdate(
            key,
            { $inc: { credit: -1 } },
            { new: true }
          );
        }
        return resReturn(res, 200, { result });
      }

      resReturn(res, 222, { err: " credit have not enough." });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };
}

module.exports = new checker();
