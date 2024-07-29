const express = require("express");
const postController = require("../controllers/post");
const router = express.Router();

router.post("/post", postController.createPost);
router.get("/all", postController.allPost);
router.get("/single/:_id", postController.singlePost);
router.put("/update", postController.updatePost);
router.delete("/delete/:_id", postController.deletePost);


router.get('/order' , postController.order )

module.exports = router;
