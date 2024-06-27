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
const EmailValidator = require("email-deep-validator");

app.use(
  cors({
    origin: ["https://pure-checker-client.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
databaseConnect();
app.use(express.static(path.join(__dirname, "public")));

async function isValidEmailDomain(email) {
  const domain = email.split("@")[1];
  try {
    const addresses = await dns.promises.resolve(domain, "MX");
    return addresses.length > 0;
  } catch (err) {
    return false; // DNS lookup failed
  }
}

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/mail", async (req, res) => {
  const emailValidator = new EmailValidator();
  const data = await emailValidator.verify("mdatick866@gmail.com");
  res.status(200).send(data);
});

app.use("/api/v1/gmail", checkerRouter);
app.use("/api/v2/user", userRouter);

app.listen(port, () => {
  console.log("▶️  app listening on port" + " " + port + "!");
});
