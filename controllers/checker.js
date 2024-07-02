require("dotenv").config();
const { default: axios } = require("axios");
const User = require("../models/userModel");
const { resReturn } = require("../utils/utils");
const { validate } = require("deep-email-validator");
const UserIp = require("../models/IpModel");
const jwt = require("jsonwebtoken");
const Api = require("../models/ApiModel");
const Plan = require("../models/PricingModel");
const user = require("./user");
const { checkEmail } = require("../utils/emailValidator");

class checker {
  deleteAllCollectionData = async (req, res) => {
    try {
      await User.deleteMany({});
      await Api.deleteMany({});
      await Plan.deleteMany({});
      resReturn(res, 200, {
        message: "all data deleted",
      });
    } catch (error) {
      resReturn(res, 222, {
        message: error.message,
      });
    }
  };

  gmailCheck = async (req, res, next) => {
    try {
      const { email } = req.query;
      const bearerToken = req.headers.authorization;
      const token = bearerToken?.split(" ")[1];
      // const data = await validate(email);
      // "data": {
      //         "email": "atick@gmail.com",
      //         "format": true,
      //         "disposable": false,
      //         "domain": true,
      //         "exists": false,
      //         "reason": "Email does not exist (SMTP check)",
      //         "mxServer": "alt1.gmail-smtp-in.l.google.com",
      //         "name": "atick",
      //         "role": "user"
      //     },

      checkEmail(email, async (result) => {
        if (!res.headersSent) {
          // res.send({ email, result });
          const data = result;

          if (data) {
            if (token === "null" || !token) {
              const x = await axios.get("https://jsonip.com");
              const ip = x.data.ip;
              const userIp = await UserIp.findOneAndUpdate(
                { ip },
                { $inc: { freeCredit: -1 } },
                { new: true }api_key="at_7avCGlfUhgBWoRADi9FNrA6FwBL0g"
                port="9999"
                jwt_secret="emailchecker2024"
                app="test"
                key="at_7avCGlfUhgBWoRADi9FNrA6FwBL0g"
              );
              // if (!userIp)
              //   return resReturn(res, 222, { err: "ip not a found." });
              resReturn(res, 200, {
                data: { ...data, email },
                userIp,
                userStatus: "default",
              });
            } else if (token !== "null") {
              // const smtp = data.exists;
              const smtp = data.exists;
              await jwt.verify(
                token,
                process.env.jwt_secret,
                async (err, verifiedJwt) => {
                  if (err) return resReturn(res, 223, { err: err.message });
                  const find = await User.findByIdAndUpdate(
                    verifiedJwt._id,
                    {
                      $inc: {
                        credit: -1,
                        invalid: smtp === false && 1,
                        deliverable: smtp === true && 1,
                      },
                    },
                    { new: true }
                  );

                  resReturn(res, 200, {
                    data: { ...data, email },
                    user: find,
                    userStatus: "login",
                  });
                }
              );
            }
          }
        }
      });
    } catch (error) {
      console.log(error.message);
      res.status(222).send(error.message);
    }
  };

  // bulksCheck = async (req, res) => {

  //   const { bulks } = req.body;
  //   console.log("01", bulks);
  //   const { _id } = req.user;
  //   let result = [];
  //   let bulkStg = "";

  //   const user = await User.findById(_id);
  //   console.log("1");
  //   if (user.subscription === true || user.payAsGo === true) {
  //     if (user.credit >= bulks.length) {
  //       console.log("2");
  //       for (const email of bulks) {
  //         console.log("4");
  //         // const data = await validate(email);
  //         checkEmail(
  //           email,
  //           async (resultData) => {
  //             // if (!res.headersSent) {
  //             console.log(`Result for ${email}: ${resultData}`);
  //             // res.send({ email, result });
  //             const data = resultData;
  //             result = [
  //               ...result,
  //               {
  //                 email,
  //                 smtp: data.exists,
  //                 format: data.format,
  //                 disposable: data.disposable,
  //               },
  //             ];
  //             bulkStg += `[${data.exists ? "Exist" : "Not Exist"}] ${email}\n`;

  //             const smtp = data.exists;

  //             await User.findByIdAndUpdate(
  //               _id,
  //               {
  //                 $inc: {
  //                   credit: -1,
  //                   invalid: smtp === false && 1,
  //                   deliverable: smtp === true && 1,
  //                 },
  //               },
  //               { new: true }
  //             );
  //           }
  //           // }
  //         );
  //       }
  //       const newFind = await User.findById(_id);
  //       return resReturn(res, 201, { result, user: newFind, bulkStg });
  //     }
  //     return resReturn(res, 222, { err: "have not credit." });
  //   }
  //   resReturn(res, 222, { err: "subscription not running." });
  // };

  bulksCheck = async (req, res) => {
    const { bulks } = req.body;
    const { _id } = req.user;
    let result = [];
    let bulkStg = "";

    const user = await User.findById(_id);

    if (user.subscription === true || user.payAsGo === true) {
      if (user.credit >= bulks.length) {

        // Array to store all the promises
        const promises = bulks.map(
          (email) =>
            new Promise(async (resolve, reject) => {
              try {
                // Validate the email
                checkEmail(email, async (resultData) => {
                  const data = resultData;
                  result.push({
                    email,
                    smtp: data.exists,
                    format: data.format,
                    disposable: data.disposable,
                  });
                  bulkStg += `[${
                    data.exists ? "Exist" : "Not Exist"
                  }] ${email}\n`;

                  const smtp = data.exists;

                  await User.findByIdAndUpdate(
                    _id,
                    {
                      $inc: {
                        credit: -1,
                        invalid: smtp === false && 1,
                        deliverable: smtp === true && 1,
                      },
                    },
                    { new: true }
                  );
                  resolve();
                });
              } catch (error) {
                reject(error);
              }
            })
        );

        // Wait for all promises to resolve
        await Promise.all(promises);

        const newFind = await User.findById(_id);
        return resReturn(res, 201, { result, user: newFind, bulkStg });
      }
      return resReturn(res, 222, { err: "have not credit." });
    }
    return resReturn(res, 222, { err: "subscription not running." });
  };

  singleEmailApi = async (req, res) => {
    const { key, email } = req.query;

    try {
      const api = await Api.findOne({ apiKey: key });

      if (!api) {
        return resReturn(res, 222, { err: "s: api check: api not found" });
      }

      const user = await User.findById(api.userId);

      if (user?.subscription === true || user?.payAsGo === true) {
        if (user?.credit === 0) {
          return resReturn(res, 222, { err: "credit ended. buy a plan now" });
        }


        try {
          const result = await new Promise((resolve, reject) => {
            checkEmail(email, (resultData) => {
              if (!res.headersSent) {
                resolve(resultData);
              } else {
                reject(new Error("Response already sent"));
              }
            });
          });

          const data = result;
          const smtp = data.exists;

          await User.findByIdAndUpdate(
            api.userId,
            { $inc: { credit: -1, apiUsage: 1 } },
            { new: true }
          );

          await Api.findByIdAndUpdate(api._id, {
            $inc: {
              invalid: smtp === false && 1,
              deliverable: smtp === true && 1,
              apiUsage: 1,
            },
          });

          return resReturn(res, 200, { data });
        } catch (error) {
          return resReturn(res, 222, { err: error.message });
        }
      } else {
        return resReturn(res, 222, { err: "subscription ended." });
      }
    } catch (error) {
      return resReturn(res, 222, { err: error.message });
    }
  };

  // singleEmailApi = async (req, res) => {
  //   const { key, email } = req.query;
  //   console.log("hi", req.query);
  //   try {
  //     const api = await Api.findOne({ apiKey: key });

  //     if (!api)
  //       return resReturn(res, 222, { err: "s: api check: api not found" });

  //     const user = await User.findById(api.userId);

  //     if (user?.subscription === true || user?.payAsGo === true) {
  //       if (user?.credit === 0)
  //         return resReturn(res, 222, { err: " credit ended. buy a plan now" });

  //       console.log("2");
  //       checkEmail(email, async (result) => {
  //         console.log("3", res.headerSent);
  //         if (!res.headersSent) {
  //           console.log("4");
  //           console.log(`Result for ${email}: ${result}`);
  //           // res.send({ email, result });
  //           const data = result;
  //           const smtp = data.exists;
  //           await User.findByIdAndUpdate(
  //             api.userId,
  //             { $inc: { credit: -1, apiUsage: 1 } },
  //             { new: true }
  //           );

  //           await Api.findByIdAndUpdate(api._id, {
  //             $inc: {
  //               invalid: smtp === false && 1,
  //               deliverable: smtp === true && 1,
  //               apiUsage: 1,
  //             },
  //           });

  //           return resReturn(res, 200, { data });
  //         }
  //       });
  //     }
  //     return resReturn(res, 222, { err: " subscription ended." });
  //   } catch (error) {
  //     resReturn(res, 222, { err: error.message });
  //   }
  // };

  // Bulk email  api
  // bulkEmailApi = async (req, res) => {
  //   const { key } = req.query;
  //   const bulks = req.body;
  //   console.log(key);
  //   try {
  //     let result = [];
  //     const api = await Api.findOne({ apiKey: key });
  //     console.log(api);
  //     if (!api)
  //       return resReturn(res, 222, { err: "s: api check: api not found" });

  //     const user = await User.findById(api.userId);
  //     if (!user)
  //       return resReturn(res, 222, { err: "s: api check: user not found" });

  //     if (user?.subscription === false || user?.payAsGo === false)
  //       return resReturn(res, 222, { err: " subscription ended." });

  //     if (bulks === "undefined" || !bulks || bulks.length === 0)
  //       return resReturn(res, 222, { err: "bulks not sended" });
  //     if (user.credit < bulks.length)
  //       return resReturn(res, 222, { err: "have not enough credits" });

  //     for (const email of bulks) {
  //       console.log(email);
  //       checkEmail(email, async (result) => {
  //         if (!res.headersSent) {
  //           console.log(`Result for ${email}: ${result}`);
  //           // res.send({ email, result });
  //           const data = result;
  //         }
  //         const smtp = data.exists;
  //         result = [...result, data];

  //         await User.findByIdAndUpdate(
  //           api.userId,
  //           { $inc: { credit: -1, apiUsage: 1 } },
  //           { new: true }
  //         );

  //         await Api.findByIdAndUpdate(
  //           api._id,
  //           {
  //             $inc: {
  //               invalid: smtp === false && 1,
  //               deliverable: smtp === true && 1,
  //               apiUsage: 1,
  //             },
  //           },
  //           { new: true }
  //         );
  //       });
  //     }
  //     return resReturn(res, 200, { result });
  //   } catch (error) {
  //     resReturn(res, 222, { err: error.message });
  //   }
  // };

  bulkEmailApi = async (req, res) => {
    const { key } = req.query;
    const bulks = req.body;

    try {
      let result = [];
      const api = await Api.findOne({ apiKey: key });

      if (!api) {
        return resReturn(res, 222, { err: "s: api check: api not found" });
      }

      const user = await User.findById(api.userId);
      if (!user) {
        return resReturn(res, 222, { err: "s: api check: user not found" });
      }

      if (!user.subscription && !user.payAsGo) {
        return resReturn(res, 222, { err: "subscription ended." });
      }

      if (!bulks || bulks.length === 0) {
        return resReturn(res, 222, { err: "bulks not sent" });
      }

      if (user.credit < bulks.length) {
        return resReturn(res, 222, { err: "not enough credits" });
      }

      // Array to store all the promises
      const promises = bulks.map(
        (email) =>
          new Promise(async (resolve, reject) => {
            try {
              checkEmail(email, async (resultData) => {
                const data = resultData;

                const smtp = data.exists;
                result.push(data);

                await User.findByIdAndUpdate(
                  api.userId,
                  { $inc: { credit: -1, apiUsage: 1 } },
                  { new: true }
                );

                await Api.findByIdAndUpdate(
                  api._id,
                  {
                    $inc: {
                      invalid: smtp === false && 1,
                      deliverable: smtp === true && 1,
                      apiUsage: 1,
                    },
                  },
                  { new: true }
                );

                resolve();
              });
            } catch (error) {
              reject(error);
            }
          })
      );

      // Wait for all promises to resolve
      await Promise.all(promises);

      return resReturn(res, 200, { result });
    } catch (error) {
      return resReturn(res, 222, { err: error.message });
    }
  };
}

module.exports = new checker();
