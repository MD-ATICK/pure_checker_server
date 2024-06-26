require("dotenv").config();
const { default: axios } = require("axios");
const User = require("../models/userModel");
const emailExistence = require("email-existence");
const {
  resReturn,
  userAuthorize,
  validateEmailFormat,
  checkMXRecords,
  checkSMTPConnection,
  validateEmail,
} = require("../utils/utils");
const { validate } = require("deep-email-validator");
const UserIp = require("../models/IpModel");
const jwt = require("jsonwebtoken");
const Api = require("../models/ApiModel");
const Plan = require("../models/PricingModel");
const user = require("./user");

class checker {
  deleteAllCollectionData = async (req, res) => {
    try {
      await User.deleteMany({});
      await Api.deleteMany({});
      await Plan.deleteMany({});
      resReturn(res, 200, {
        message: "all data deleted",
      });
    } catch (error) {
      resReturn(res, 222, {
        message: error.message,
      });
    }
  };

  gmailCheck = async (req, res, next) => {
    try {
      const { email } = req.query;
      const bearerToken = req.headers.authorization;
      const token = bearerToken?.split(" ")[1];
      console.log("31", { token, email });

      // const data = await validate(email);
      emailExistence.check(email, (err, exists) => {
        res.send(exists);
        console.log("Exists:", exists);
      });

      // if (data) {
      //   if (token === "null" || !token) {
      //     console.log("1");
      //     const x = await axios.get("https://jsonip.com");
      //     const ip = x.data.ip;
      //     const userIp = await UserIp.findOneAndUpdate(
      //       { ip },
      //       { $inc: { freeCredit: -1 } },
      //       { new: true }
      //     );
      //     if (!userIp) return resReturn(res, 222, { err: "ip not found." });
      //     resReturn(res, 200, {
      //       data: { ...data, email },
      //       userIp,
      //       userStatus: "default",
      //     });
      //   } else if (token !== "null") {
      //     console.log("3");
      //     const smtp = data.validators.smtp.valid;
      //     await jwt.verify(
      //       token,
      //       process.env.jwt_secret,
      //       async (err, verifiedJwt) => {
      //         if (err) return resReturn(res, 223, { err: err.message });
      //         const find = await User.findByIdAndUpdate(
      //           verifiedJwt._id,
      //           {
      //             $inc: {
      //               credit: -1,
      //               invalid: smtp === false && 1,
      //               deliverable: smtp === true && 1,
      //             },
      //           },
      //           { new: true }
      //         );

      //         console.log({ find });
      //         resReturn(res, 200, {
      //           data: { ...data, email },
      //           user: find,
      //           userStatus: "login",
      //         });
      //       }
      //     );
      //   }
      // }
    } catch (error) {
      console.log(error.message);
      res.status(222).send(error.message);
    }
  };

  bulksCheck = async (req, res) => {
    const { bulks } = req.body;
    const { _id } = req.user;
    let result = [];
    let bulkStg = "";

    const user = await User.findById(_id);
    console.log(user);
    if (user.subscription === true || user.payAsGo === true) {
      if (user.credit >= bulks.length) {
        for (const email of bulks) {
          const data = await validate(email);
          result = [
            ...result,
            {
              email,
              smtp: data.validators.smtp.valid,
              format: data.validators.regex.valid,
              disposable: data.validators.disposable.valid,
            },
          ];
          bulkStg += `[${
            data.validators.smtp.valid ? "Exist" : "Not Exist"
          }] ${email}\n`;

          const smtp = data.validators.smtp.valid;

          await User.findByIdAndUpdate(
            _id,
            {
              $inc: {
                credit: -1,
                invalid: smtp === false && 1,
                deliverable: smtp === true && 1,
              },
            },
            { new: true }
          );
        }
        const newFind = await User.findById(_id);
        return resReturn(res, 201, { result, user: newFind, bulkStg });
      }
      return resReturn(res, 222, { err: "have not credit." });
    }
    resReturn(res, 222, { err: "subscription not running." });
  };

  singleEmailApi = async (req, res) => {
    const { key, gmail } = req.query;
    console.log(key);
    try {
      const api = await Api.findOne({ apiKey: key });
      console.log(api);
      if (!api)
        return resReturn(res, 222, { err: "s: api check: api not found" });

      const user = await User.findById(api.userId);
      if (user?.subscription === false || user?.payAsGo === false)
        return resReturn(res, 222, { err: " subscription ended." });

      if (user?.credit === 0)
        return resReturn(res, 222, { err: " credit ended. buy a plan now" });

      const data = await validate(gmail);
      const smtp = data.validators.smtp.valid;

      await User.findByIdAndUpdate(
        api.userId,
        { $inc: { credit: -1, apiUsage: 1 } },
        { new: true }
      );

      await Api.findByIdAndUpdate(api._id, {
        $inc: {
          invalid: smtp === false && 1,
          deliverable: smtp === true && 1,
          apiUsage: 1,
        },
      });

      resReturn(res, 200, { data: { ...data, gmail } });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  // Bulk email  api
  bulkEmailApi = async (req, res) => {
    const { key } = req.query;
    const bulks = req.body;
    console.log(key);
    try {
      let result = [];
      const api = await Api.findOne({ apiKey: key });
      console.log(api);
      if (!api)
        return resReturn(res, 222, { err: "s: api check: api not found" });

      const user = await User.findById(api.userId);
      if (!user)
        return resReturn(res, 222, { err: "s: api check: user not found" });

      if (user?.subscription === false || user?.payAsGo === false)
        return resReturn(res, 222, { err: " subscription ended." });

      if (bulks === "undefined" || !bulks || bulks.length === 0)
        return resReturn(res, 222, { err: "bulks not sended" });
      if (user.credit < bulks.length)
        return resReturn(res, 222, { err: "have not enough credits" });

      for (const email of bulks) {
        console.log(email);
        const data = await validate(email);

        const smtp = data.validators.smtp.valid;
        result = [...result, { email, ...data }];

        await User.findByIdAndUpdate(
          api.userId,
          { $inc: { credit: -1, apiUsage: 1 } },
          { new: true }
        );

        await Api.findByIdAndUpdate(
          api._id,
          {
            $inc: {
              invalid: smtp === false && 1,
              deliverable: smtp === true && 1,
              apiUsage: 1,
            },
          },
          { new: true }
        );
      }
      return resReturn(res, 200, { result });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };
}

module.exports = new checker();
