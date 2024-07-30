require("dotenv").config();
const User = require("../models/userModel");
const { resReturn, sendMail, tokenCreate } = require("../utils/utils");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");

const clientUrl =
  process.env.server === "prod"
    ? process.env.clientWebUrl
    : "http://localhost:5173";

console.log({ clientUrl });

class mailController {
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
}

module.exports = new mailController();
