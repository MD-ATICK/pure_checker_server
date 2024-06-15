require("dotenv").config();
const { default: axios } = require("axios");
const User = require("../models/userModel");
const { resReturn } = require("../utils/utils");
const emailValidator = require("deep-email-validator");
class checker {
  gmailCheck = async (req, res) => {
    try {
      console.log({ query: req.query });
      const { _id } = req.user;
      const { email } = req.query;

      if (email === undefined) return res.status(222).send("email not found");
      const data = await emailValidator.validate(email);
      const user = await User.findByIdAndUpdate(
        _id,
        { $inc: { credit: -1 } },
        { new: true }
      ).select("-password");
      console.log(user, data);
      resReturn(res, 200, { data : {...data, email , }, user });
    } catch (error) {
      console.log(error.message);
      res.status(222).send(error.message);
    }
  };

  apiCheck = async (req, res) => {
    const { key, gmail } = req.query;
    console.log(key, gmail);
    if (key !== process.env.key)
      return resReturn(res, 222, { err: "incorrect key" });
    const check = await emailValidator.validate(gmail);
    res
      .status(200)
      .json({ status: 200, msg: "successfully email checked.", data: check });
  };
}

module.exports = new checker();
