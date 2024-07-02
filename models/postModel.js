const { default: mongoose } = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    img: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    content: [{ type: String }],
  },
  { timestamps: true }
);

const Post = mongoose.model("posts", postSchema);
module.exports = Post;
