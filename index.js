require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.port || 3000;
const cors = require("cors");
const userRouter = require("./router/userRoute");
const checkerRouter = require("./router/CheckerRoute");
const postRouter = require("./router/postRoute");
const apisRouter = require("./router/ApisRoute");
const paymentRouter = require("./router/paymentRoute");
const mailRouter = require("./router/mailRoute");
const adminRouter = require("./router/adminRoute");
const otpRouter = require("./router/otpRoute");
const planRouter = require("./router/planRoute");
const volumeRouter = require("./router/volumeRoute");
// const maintenanceRouter = require("./router/MaintenanceRoute");
const { databaseConnect } = require("./utils/DatabaseConnect");
const path = require("path");
const { resReturn } = require("./utils/utils");
const { upload } = require("./utils/Multer");
const { checkEmail } = require("./utils/emailValidator");


console.log({ server: process.env.server, url: process.env.clientWebUrl });

const clientUrl =
  process.env.server === "prod"
    ? process.env.clientWebUrl
    : "http://localhost:5173";

const options = {
  origin: ["https://purechecker.com" , "http://localhost:5173" , "https://spiffy-salamander-bf0160.netlify.app"],
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
app.use("/api/v5/apis", apisRouter);
app.use("/api/v6/payment", paymentRouter);
app.use("/api/v7/mailSent", mailRouter);
app.use("/api/v8/volume", volumeRouter);
app.use("/api/v9/admin", adminRouter);
app.use("/api/v10/plan", planRouter);
app.use("/api/v11/otp", otpRouter);

app.listen(port, () => {
  console.log("▶️  app listening on port" + " " + port + "!");
});