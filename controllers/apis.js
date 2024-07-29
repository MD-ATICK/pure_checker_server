require('dotenv').config()
const Api = require("../models/ApiModel");
const User = require("../models/userModel");
const { resReturn } = require("../utils/utils");

class apisController {
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

      await Api.create({
        userId: _id,
        apiName,
      });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }

    resReturn(res, 201, { msg: "api created", newApi });
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
}

module.exports = new apisController();
