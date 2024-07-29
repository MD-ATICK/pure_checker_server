const express = require("express");
const Volume = require("../controllers/Volume");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.get("/get-volume", Volume.get);
router.post("/create-volume", userAuthorize, Volume.add);
router.put("/update-volume", userAuthorize, Volume.update);
router.delete("/delete-volume/:_id", userAuthorize, Volume.delete);

module.exports = router;
