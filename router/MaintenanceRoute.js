const express = require("express");
const {
  checking,
  create,
  remove,
  getAll,
} = require("../controllers/maintenance.js");
const router = express.Router();

router.get("/create", create);
router.get("/remove", remove);
router.get("/checking", checking);
router.get("/all-maintenance", getAll);

module.exports = router;
