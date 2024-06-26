require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.resReturn = async (res, status, body) => {
  return res.status(status).send(body);
};

exports.tokenCreate = async (user) => {
  const token = await jwt.sign(user, process.env.jwt_secret, {
    expiresIn: "7d",
  });
  return token;
};

exports.userAuthorize = async (req, res, next) => {
  const bearerToken = req.headers.authorization;
  try {
    const token = bearerToken.split(" ")[1];
    if (!token) return this.resReturn(res, 222, { err: "token not found s" });
    await jwt.verify(
      token,
      process.env.jwt_secret,
      async (err, verifiedJwt) => {
        if (err) return this.resReturn(res, 223, { err: err.message });
        verifiedJwt;
        console.log({ verifiedJwt });
        req.user = verifiedJwt;
        return next();
      }
    );
  } catch (error) {
    console.log("s: auth error:", error.message);
  }
};

