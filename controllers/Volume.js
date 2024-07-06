const Volume = require("../models/PricingModel");
const { resReturn } = require("../utils/utils");

class VolumeController {
  add = async (req, res) => {
    try {
      const { planType, totalCredits, perDay, price } = req.body;
      const volume = await Volume.create({
        planType,
        totalCredits,
        perDay,
        price,
      });
      resReturn(res, 201, { msg: "created volume", volume });
    } catch (err) {
      resReturn(res, 222, { err: err.message });
    }
  };

  get = async (req, res) => {
    try {
      const volumes = await Volume.find({});
      resReturn(res, 201, { msg: "get volume", volumes });
    } catch (err) {
      resReturn(res, 222, { err: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { _id } = req.params;
      const volume = await Volume.findByIdAndDelete(_id);
      resReturn(res, 200, { msg: "deleted volume", volume });
    } catch (err) {
      resReturn(res, 222, { err: err.message });
    }
  };

  update = async (req, res) => {
    const { volumeId, planType, totalCredits, price } = req.body;
    const volume = await Volume.findByIdAndUpdate(
      volumeId,
      {
        planType,
        totalCredits,
        price,
      },
      { new: true }
    );
    resReturn(res, 201, { msg: "updated volume", volume });
    try {
    } catch (err) {
      resReturn(res, 222, { err: err.message });
    }
  };
}

module.exports = new VolumeController();
