require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.port || 3000;
const cors = require("cors");
const userRouter = require("./router/userRoute");
const checkerRouter = require("./router/CheckerRoute");
const postRouter = require("./router/postRoute");
const { databaseConnect } = require("./utils/DatabaseConnect");
const path = require("path");
// const fileUpload = require("express-fileupload");
const { resReturn } = require("./utils/utils");
const { upload } = require("./utils/Multer");

const options = {
  origin: ["https://pure-checker-client.vercel.app", "http://localhost:5173"],
  credentials: true,
};

databaseConnect();
app.use(cors(options));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/hi", (req, res) =>
  resReturn(res, 200, { msg: path.join(__dirname) })
);

app.post("/img-upload", upload.single("file"), (req, res) => {
  res.status(201).send({ msg: "upload successful", img: req?.file?.filename });
});

app.use("/api/v1/gmail", checkerRouter);
app.use("/api/v2/user", userRouter);
app.use("/api/v3/post", postRouter);

app.listen(port, () => {
  console.log("▶️  app listening on port" + " " + port + "!");
});
