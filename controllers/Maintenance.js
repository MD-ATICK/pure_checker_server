const Maintenance = require("../models/MaintananceModel");
const { resReturn } = require("../utils/utils");

class MaintenanceController {
  create = async (req, res) => {
    // const { title, description } = req.body;
    try {
      const find = await Maintenance.findOne({ status: "open" });
      if (find)
        return resReturn(res, 222, { err: "already running a maintenance" });

      const maintenance = await Maintenance.create({
        status: "open",
      });
      res.status(201).json({ msg: "created sucess", maintenance });
    } catch (error) {
      res.status(222).json({ message: error.message });
    }
  };

  remove = async (req, res) => {
    // const { _id } = req.params;
    // if (!_id) return resReturn(res, 222, { err: "_id not found" });
    const find = await Maintenance.findOne({ status: "open" });
    if (!find) return resReturn(res, 222, { err: "maintenance not found" });

    const update = await Maintenance.findByIdAndUpdate(
      find?._id,
      { status: "closed" },
      { new: true }
    );
    return resReturn(res, 200, { msg: " updated successfully", update });
  };

  checking = async (req, res) => {
    const find = await Maintenance.findOne({ status: "open" });
    if (find) {
      return resReturn(res, 200, {
        msg: "have maintenance",
        maintenance: find,
      });
    }
    resReturn(res, 222, { msg: "not have maintenance" });
  };

  getAll = async (req, res) => {
    const maintenances = await Maintenance.find({});

    resReturn(res, 200, { msg: "all maintenance", maintenances });
  };
}

module.exports = new MaintenanceController();
