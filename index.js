require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.port || 3000;
const cors = require("cors");
const userRouter = require("./router/userRoute");
const checkerRouter = require("./router/CheckerRoute");
const postRouter = require("./router/postRoute");
const maintenanceRouter = require("./router/MaintananceRoute");
const { databaseConnect } = require("./utils/DatabaseConnect");
const path = require("path");
const { resReturn } = require("./utils/utils");
const { upload } = require("./utils/Multer");
const { checkEmail } = require("./utils/emailValidator");

// const options = {
//   origin: ["https://pure-checker-client.vercel.app", "https://purechecker.com"],
//   credentials: true,
// };

if (!process.env.server || !process.env.clientWebUrl) {
  return console.log("env file not found.");
}

const clientUrl =
  process.env.server === "prod"
    ? process.env.clientWebUrl
    : "http://localhost:5173";

console.log({ server: process.env.server, url: process.env.clientWebUrl });

const options = {
  origin: [clientUrl],
  credentials: true,
};

databaseConnect();
app.use(cors({ origin: "*", credentials: true }));
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

app.get("/test/:email", (req, res) => {
  const { email } = req.params;

  checkEmail(email, async (result) => {
    res.status(200).send(result);
  });
});

app.use("/api/v1/gmail", checkerRouter);
app.use("/api/v2/user", userRouter);
app.use("/api/v3/post", postRouter);
app.use("/api/v4/maintenance", maintenanceRouter);

app.listen(port, () => {
  console.log("▶️  app listening on port" + " " + port + "!");
});
