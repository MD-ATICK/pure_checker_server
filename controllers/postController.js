const Post = require("../models/postModel");
const { resReturn } = require("../utils/utils");

// content: [
//   `<h1>Hello world..!</h1> <br/>
// <p>Compared to other marketing channels, email marketing is relatively inexpensive. It requires minimal investment and can yield significant returns.</p>`,
// ],

// img: { type: String, required: true },
// title: { type: String, required: true },
// category: { type: String, required: true },
// description: { type: String, required: true },
// tags: [{ type: String }],
// content: [{ type: String}]

class PostController {
  allPost = async (req, res) => {
    const posts = await Post.find({});
    resReturn(res, 200, { msg: "posts get.", posts });
  };

  singlePost = async (req, res) => {
    const { _id } = req.params;
    const post = await Post.findById(_id);
    if (!post) return resReturn(res, 222, { err: "post not found!" });

    const similar = await Post.find({
      category: post?.category,
      _id: { $ne: _id },
    });
    resReturn(res, 200, { msg: "single post get.", post, similar });
  };

  updatePost = async (req, res) => {
    const { _id, img, title, category, description, tags, content } = req.body;
    console.log(req.body);

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
  };

  createPost = async (req, res) => {
    const { img, title, category, description, tags, content } = req.body;
    console.log("createPost", req.body);

    const find = await Post.findOne({ title });
    if (find) return resReturn(res, 222, { err: "this post has already been" });

    const post = await Post.create({
      img,
      title,
      category,
      description,
      tags: tags,
      content: content,
    });
    resReturn(res, 201, { msg: "post created.", post: post });
  };

  deletePost = async (req, res) => {
    const { _id } = req.params;
    console.log(_id);
    const find = await Post.findById(_id);
    if (!find) return resReturn(res, 222, { error: "not found" });
    const deletedPost = await Post.findByIdAndDelete(_id);

    resReturn(res, 200, { msg: "post deleted.", deletedPost });
  };

  // end
}

module.exports = new PostController();
