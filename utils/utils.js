require("dotenv").config();
const jwt = require("jsonwebtoken");
const dns = require('dns');
const net = require('net');

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

exports.checkMXRecords = (domain) => {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) return reject(err);
      if (addresses && addresses.length > 0) {
        addresses.sort((a, b) => a.priority - b.priority);
        resolve(addresses);
      } else {
        reject(new Error('No MX records found'));
      }
    });
  });
};


exports.validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.checkSMTPConnection = (email, addresses) => {
  return new Promise((resolve, reject) => {
    const timeout = 5000;
    let connected = false;

    const address = addresses[0].exchange;
    const local = net.createConnection(25, address);

    local.on('connect', () => {
      connected = true;
      local.write(`HELO ${address}\r\n`);
      local.write(`MAIL FROM: <test@example.com>\r\n`);
      local.write(`RCPT TO: <${email}>\r\n`);
      local.write('QUIT\r\n');
    });

    local.on('data', (data) => {
      if (data.toString().includes('250')) {
        resolve(true);
      } else {
        resolve(false);
      }
      local.end();
    });

    local.on('error', (err) => {
      if (!connected) {
        reject(err);
      }
    });

    local.setTimeout(timeout, () => {
      if (!connected) {
        reject(new Error('SMTP connection timed out'));
      }
    });
  });
};