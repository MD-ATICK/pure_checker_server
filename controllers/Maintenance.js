require("dotenv").config();
const Maintenance = require("../models/MaintananceModel");
const { resReturn } = require("../utils/utils");

exports.create = async (req, res) => {
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

exports.remove = async (req, res) => {
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

exports.checking = async (req, res) => {
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

exports.getAll = async (req, res) => {
  try {
    const maintenances = await Maintenance.find({});
    resReturn(res, 200, { msg: "all maintenance", maintenances });
  } catch (error) {
    resReturn(res, 222, { err: error.message });
  }
};
