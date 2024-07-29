require('dotenv').config()
const User = require('../models/userModel');
const { resReturn, sendMail, tokenCreate } = require("../utils/utils");
const jwt = require('jsonwebtoken')

class otpController {

    sendOTP = async (req, res) => {
        try {
          const { email } = req.params;
          if (!email) return resReturn(res, 222, { err: "Invalid email" });
          let otp = "";
          for (let i = 0; i < 6; i++) {
            otp += Math.round(Math.random() * 9);
          }
          const secret = `${process.env.jwt_secret}`;
          const tokenTwoFA = await jwt.sign({ email, otp }, secret, {
            expiresIn: "15m",
          });
          const find = await User.findOne({ email });
          if (!find) return resReturn(res, 222, { err: "user not found" });
    
          await sendMail("twoFector", email, find?.name || "John", otp);
    
          resReturn(res, 200, { tokenTwoFA });
        } catch (error) {
          resReturn(res, 222, { err: error.message });
        }
      };
    
      verifyOTP = async (req, res) => {
        try {
          const { email, otp, tokenTwoFA, twoFectorAuthSave } = req.body;
          const find = await User.findOne({ email });
          if (!find)
            return resReturn(res, 222, { err: "user not exist with this email" });
          if (!otp || otp.length < 6)
            return resReturn(res, 222, { err: "user not exist with this email" });
    
          const secret = `${process.env.jwt_secret}`;
          await jwt.verify(tokenTwoFA, secret, async (err, verifiedJwt) => {
            if (err) return resReturn(res, 222, { err: err.message });
            if (otp !== verifiedJwt.otp)
              return resReturn(res, 222, { err: "otp not valid" });
            if (twoFectorAuthSave) {
              await User.updateOne(
                { email: verifiedJwt.email },
                { twoFectorAuthSave: true }
              );
            }
            const find = await User.findOne({ email: verifiedJwt.email });
            const token = await tokenCreate({
              _id: find._id,
              role: find.role,
              email: find.email,
            });
            resReturn(res, 201, {
              msg: "two fector auth succesed.",
              user: find,
              token,
            });
          });
        } catch (error) {
          resReturn(res, 222, { err: error.message });
        }
      };
    

}


module.exports = new otpController()