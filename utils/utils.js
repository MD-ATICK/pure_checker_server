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
  if (!bearerToken)
    return this.resReturn(res, 222, { err: "token not found s" });

  const token = bearerToken.split(" ")[1];
  const user = await jwt.verify(
    token,
    process.env.jwt_secret,
    async (err, verifiedJwt) => {
      if (err) return this.resReturn(res, 223, { err: err.message });
      return verifiedJwt;
    }
  );
  req.user = user;
  next();
};
