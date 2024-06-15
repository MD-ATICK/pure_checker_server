require("dotenv").config();
const { default: axios } = require("axios");
const express = require("express");
const app = express();
const port = process.env.port || 3000;
const cors = require("cors");
const userRouter = require("./router/userRoute");
const checkerRouter = require("./router/CheckerRoute");
const { databaseConnect } = require("./utils/DatabaseConnect");
const moment = require("moment");
const emailvalidator = require("deep-email-validator");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
databaseConnect();

app.get("/", async (req, res) => {
  const { data } = await axios.get("https://jsonip.com");
  let previousDate = moment("2024-06-13").format("YYYY-MM-DD");
  const currentDate = moment().format("YYYY-MM-DD");
  const endDate = moment().add(30, "days").format("YYYY-MM-DD");

  let today;
  if (previousDate !== currentDate) {
    today = "data should updated and credit +2500";
    previousDate = currentDate;
  } else {
    today = "already collected credit.";
  }

  const ip = data.ip;
  const email = "contact@jsmastery.pro";
  const revalid = await emailvalidator.validate(email);
  res.send({
    say: "Hello world!",
    email,
    revalid,
    ip,
    today,
    currentDate,
    previousDate,
    endDate,
  });
});
app.use("/api/v1/gmail", checkerRouter);
app.use("/api/v2/user", userRouter);

app.listen(port, () => {
  console.log("▶️  app listening on port" + " " + port + "!");
});
