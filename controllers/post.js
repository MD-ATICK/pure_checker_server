require("dotenv").config();
const { default: axios } = require("axios");
const Post = require("../models/postModel");
const { resReturn } = require("../utils/utils");
const crypto = require("crypto");

class PostController {
  allPost = async (req, res) => {
    try {
      const { page } = req.query;

      const totalPosts = await Post.countDocuments({});

      const posts = await Post.find({})
        .skip((page - 1) * 10)
        .limit(10);
      resReturn(res, 200, {
        msg: "posts get.",
        posts,
        count: totalPosts,
      });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  singlePost = async (req, res) => {
    try {
      const { _id } = req.params;
      const post = await Post.findById(_id);
      if (!post) return resReturn(res, 222, { err: "post not found!" });

      const similar = await Post.find({
        category: post?.category,
        _id: { $ne: _id },
      });
      resReturn(res, 200, { msg: "single post get.", post, similar });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  updatePost = async (req, res) => {
    try {
      const { _id, img, title, category, description, tags, content } =
        req.body;

      const find = await Post.findById(_id);
      if (!find) return resReturn(res, 222, { err: "post not found!" });

      const updatedPost = await Post.findByIdAndUpdate(
        _id,
        { img, title, category, description, tags, content },
        { new: true }
      );
      resReturn(res, 201, {
        msg: "updated post successfully",
        post: updatedPost,
      });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  createPost = async (req, res) => {
    try {
      const { img, title, category, description, tags, content } = req.body;

      const find = await Post.findOne({ title });
      if (find)
        return resReturn(res, 222, { err: "this post has already been" });

      const post = await Post.create({
        img,
        title,
        category,
        description,
        tags: tags,
        content: content,
      });
      resReturn(res, 201, { msg: "post created.", post: post });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  deletePost = async (req, res) => {
    try {
      const { _id } = req.params;
      const find = await Post.findById(_id);
      if (!find) return resReturn(res, 222, { error: "not found" });
      const deletedPost = await Post.findByIdAndDelete(_id);

      resReturn(res, 200, { msg: "post deleted.", deletedPost });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };

  order = async (req, res) => {
    if (!process.env.clientWebUrl)
      return resReturn(res, 222, { err: "env not found." });

    try {
      const apiKey =
        "nmSI06rxR03Yzdvl6a0aUvJxlfeNMQrjegAWOIrgayqnR2y4sCD5wz29LLkY77FXplOT6aK1c5CjOlQkqWUQwLTIyVDXymdPTCm6qMDYsdV75NkK51bn1foaqgA0yVKB";
      const payload = {
        order_id: "1234",
        currency: "USD",
        amount: 999,
        url_callback: process.env?.clientWebUrl,
      };
      const merchant = "9e7f1691-ee72-4447-8c3a-9afeb2074de9";
      const bufferData = Buffer.from(JSON.stringify(payload))
        .toString("base64")
        .concat(apiKey);
      const sign = crypto.createHash("md5").update(bufferData).digest("hex");
      const url = "https://api.cryptomus.com/v1/payment";

      const { data } = await axios.post(`${url}`, payload, {
        headers: {
          merchant,
          sign,
          "Content-Type": "application/json",
        },
      });
      resReturn(res, 200, { msg: "order created.", data });
    } catch (error) {
      resReturn(res, 222, { err: error.message });
    }
  };
  // end
}

module.exports = new PostController();
