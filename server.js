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
    origin:
      ["https://6672b66dedf85b0497ad5cfb--spiffy-salamander-bf0160.netlify.app"  , 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json());
databaseConnect();

app.get("/", async (req, res) => {
  const {
    data: { ip },
  } = await axios.get("https://jsonip.com/");
  res.send({
    say: "Hello world!",
    ip,
  });
});

app.use("/api/v1/gmail", checkerRouter);
app.use("/api/v2/user", userRouter);

app.listen(port, () => {
  console.log("▶️  app listening on port" + " " + port + "!");
});
