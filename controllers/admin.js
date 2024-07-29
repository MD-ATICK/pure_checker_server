require('dotenv').config()
const User = require('../models/userModel');
const { resReturn } = require('../utils/utils');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


class adminController {
     
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

module.exports = new adminController();
