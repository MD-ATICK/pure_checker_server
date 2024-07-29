const express = require("express");
const admin = require("../controllers/admin");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.delete("/delete", admin.deleteMany);
router.get("/getUsers", userAuthorize, admin.getMany);
router.get("/block/:_id", admin.block);
router.post("/add-user", admin.addUser); // email auth
router.post("/adjust/:_id", admin.adjustUser);

module.exports = router;
