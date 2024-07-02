const express = require("express");
const Maintenance = require("../controllers/Maintenance");
const router = express.Router();

router.get("/create", Maintenance.create);
router.get("/remove", Maintenance.remove);
router.get("/checking", Maintenance.checking);
router.get("/all-maintenance", Maintenance.getAll);

module.exports = router;
