// api/validate-email.js

const { validate } = require("deep-email-validator");

const emailValidateApi = async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  const email = req.query.email || "mdatick866@email.com"; // Replace with the actual email parameter from your request
  const data = await validate(email);
  return data;
};

module.exports = emailValidateApi;
