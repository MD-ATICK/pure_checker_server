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
const path = require("path");

app.use(
  cors({
    origin: "https://spiffy-salamander-bf0160.netlify.app",
    credentials: true,
  })
);
app.use(express.json());
databaseConnect();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/api/gmail", checkerRouter);
app.use("/api/user", userRouter);

app.listen(port, () => {
  console.log("▶️  app listening on port" + " " + port + "!");
});
