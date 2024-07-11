require("dotenv").config();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");

exports.resReturn = async (res, status, body) => {
  return res.status(status).json(body);
};

exports.tokenCreate = async (user) => {
  const token = await jwt.sign(user, process.env.jwt_secret, {
    expiresIn: "7d",
  });
  return token;
};

exports.roleCheck = async (req, res, next) => {
  try {
    const _id = req.user._id;
    if (!_id) return this.resReturn(res, 222, { err: "_id not found." });

    const user = await User.findById(_id);
    if (!user) return this.resReturn(res, 222, { err: "user not found." });

    if (user.role === "admin") {
      return next();
    }

    this.resReturn(res, 222, { err: "user access not allowed." });
  } catch (error) {
    this.resReturn(res, 222, { err: error.message });
  }
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
        req.user = verifiedJwt;
        return next();
      }
    );
  } catch (error) {
    console.log("s: auth error:", error.message);
  }
};

exports.sendMail = async (type, email, name, link) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: "mohammadatick1111@gmail.com",
      pass: "xeanvdgsnnyqlnpt",
    },
  });

  if (type === "verify") {
    const html = `<table style="width: 100%; padding: 30px;">
        <tr>
          <td>
            <table style="max-width: 450px; width: 100%; background: #e6ece9; margin: auto;">
              <tr>
                <td style="background: blue; height: 80px; text-align: center;">
                  <h1 style={{ fontSize: '2rem' ,color :'white', fontWeight : '600'}}>Pure Checker</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px; border-top: 6px solid #09316D;">
                  <p>Hello, <span style="font-weight: 600; font-size: 18px;">${name}</span></p>
                  <p style="font-size: 15px;">Welcome to pure checker. we are excited to have you join out community. Before you get started, you need to verify you email address to ensure we have the correct impormation.</p>
                  <p style="text-align: center;">
                    <a href="${link}" style="display: inline-block; margin: 0 20px; padding: 15px 40px; font-size: 20px; background: blue; color: white; font-weight: 500; border-radius: 50px; text-decoration: none;">Verify</a>
                  </p>
                  <p style="font-size: 14px;">If this attempt was not you, email <span style="font-weight: 600;">support@example.com</span> so we can assist you.</p>
                </td>
              </tr>
              <tr>
                <td style="background: blue; color: #e6ece9; font-size: 14px; text-align: center; padding: 20px 0;">
                  <p>Pure Checker, Inc</p>
                  <p>San Francisco CA 68592</p>
                  <p>&copy; 2024</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    const info = await transporter.sendMail({
      from: "support@pureChecker.com",
      to: email,
      subject: "Pure Checker Email Validation Email",
      html,
    });
    return { status: true, msg: `mail sent at : ${email}`, info: info };
  } else if (type === "forget") {
    const html = `<table style="width: 100%; padding: 30px;">
    <tr>
      <td>
        <table style="max-width: 450px; width: 100%; background: #e6ece9; margin: auto;">
          <tr>
            <td style="background: blue; height: 80px; text-align: center;">
              <h1 style={{ fontSize: '2rem', color :'white' , fontWeight : '600'}}>Pure Checker</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; border-top: 6px solid #09316D;">
              <p>Hello, <span style="font-weight: 600; font-size: 18px;">${name}</span></p>
              <p style="font-size: 15px;">Welcome to pure checker. we are sad for your forgent password.Before you get started, you need to click forget password to ensure we have the correct impormation.</p>
              <p style="text-align: center;">
                <a href="${link}" style="display: inline-block; margin: 0 20px; padding: 15px 40px; font-size: 20px; background: blue; color: white; font-weight: 500; border-radius: 50px; text-decoration: none;">Forget Password</a>
              </p>
              <p style="font-size: 14px;">If this attempt was not you, email <span style="font-weight: 600;">support@example.com</span> so we can assist you.</p>
            </td>
          </tr>
          <tr>
            <td style="background: blue; color: #e6ece9; font-size: 14px; text-align: center; padding: 20px 0;">
              <p>Pure Checker, Inc</p>
              <p>San Francisco CA 68592</p>
              <p>&copy; 2024</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

    const info = await transporter.sendMail({
      from: "support@pureChecker.com",
      to: email,
      subject: "Pure Checker Forget Password Validation Email",
      html,
    });
    return { status: true, msg: `mail sent at : ${email}`, info: info };
  } else if (type === "twoFector") {
    const html = `<table style="width: 100%; padding: 30px;">
    <tr>
      <td>
        <table style="max-width: 450px; width: 100%; background: #e6ece9; margin: auto;">
          <tr>
            <td style="background: blue; height: 80px; text-align: center;">
              <h1 style={{ fontSize: '2rem',color :'white' , fontWeight : '600'}}>Pure Checker</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; border-top: 6px solid #09316D;">
              <p><span style="font-weight: 600; font-size: 18px;">Customer Service,</span></p>
              <div style={{ fontSize: '15px' }}>${link}</div>
              <p style="font-size: 14px;">If this attempt was not you, email <span style="font-weight: 600;">support@example.com</span> so we can assist you.</p>
            </td>
          </tr>
          <tr>
            <td style="background: blue; color: #e6ece9; font-size: 14px; text-align: center; padding: 20px 0;">
              <p>Pure Checker, Inc</p>
              <p>San Francisco CA 68592</p>
              <p>&copy; 2024</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

    const info = await transporter.sendMail({
      from: "support@pureChecker.com",
      to: email,
      subject: "Pure Checker customer mail",
      html,
    });
    return;
  } else {
    const html = `<table style="width: 100%; padding: 30px;">
    <tr>
      <td>
        <table style="max-width: 450px; width: 100%; background: #e6ece9; margin: auto;">
          <tr>
            <td style="background: blue; height: 80px; text-align: center;">
              <h1 style={{ fontSize: '2rem',color :'white' , fontWeight : '600'}}>Pure Checker</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; border-top: 6px solid #09316D;">
              <p><span style="font-weight: 600; font-size: 18px;">Customer Service,</span></p>
              <div style={{ fontSize: '15px' }}>${link}</div>
              <p style="font-size: 14px;">If this attempt was not you, email <span style="font-weight: 600;">support@example.com</span> so we can assist you.</p>
            </td>
          </tr>
          <tr>
            <td style="background: blue; color: #e6ece9; font-size: 14px; text-align: center; padding: 20px 0;">
              <p>Pure Checker, Inc</p>
              <p>San Francisco CA 68592</p>
              <p>&copy; 2024</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

    const info = await transporter.sendMail({
      from: "support@pureChecker.com",
      to: email,
      subject: "Pure Checker customer mail",
      html,
    });
    return { status: true, msg: `mail sent at : ${email}`, info: info };
  }
};
