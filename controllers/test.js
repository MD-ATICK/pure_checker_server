const bulksCheck = async (req, res) => {
  const { bulks } = req.body;
  const { _id } = req.user;
  let result = [];
  let bulkStg = "";

  const user = await User.findById(_id);
  if (user.subscription === true || user.payAsGo === true) {
    if (user.credit >= bulks.length) {
      for (const email of bulks) {
        // const data = await validate(email);
        checkEmail(
          email,
          async (resultData) => {
            const data = resultData;
            result = [
              ...result,
              {
                email,
                smtp: data.exists,
                format: data.format,
                disposable: data.disposable,
              },
            ];
            bulkStg += `[${data.exists ? "Exist" : "Not Exist"}] ${email}\n`;

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
          }
          // }
        );
      }
      const newFind = await User.findById(_id);
      return resReturn(res, 201, { result, user: newFind, bulkStg });
    }
    return resReturn(res, 222, { err: "have not credit." });
  }
  resReturn(res, 222, { err: "subscription not running." });
};

const singleEmailApi = async (req, res) => {
  const { key, email } = req.query;
  try {
    const api = await Api.findOne({ apiKey: key });

    if (!api)
      return resReturn(res, 222, { err: "s: api check: api not found" });

    const user = await User.findById(api.userId);

    if (user?.subscription === true || user?.payAsGo === true) {
      if (user?.credit === 0)
        return resReturn(res, 222, { err: " credit ended. buy a plan now" });

      checkEmail(email, async (result) => {
        if (!res.headersSent) {
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
        }
      });
    }
    return resReturn(res, 222, { err: " subscription ended." });
  } catch (error) {
    resReturn(res, 222, { err: error.message });
  }
};

const bulkEmailApi = async (req, res) => {
  const { key } = req.query;
  const bulks = req.body;
  console.log(key);
  try {
    let result = [];
    const api = await Api.findOne({ apiKey: key });
    console.log(api);
    if (!api)
      return resReturn(res, 222, { err: "s: api check: api not found" });

    const user = await User.findById(api.userId);
    if (!user)
      return resReturn(res, 222, { err: "s: api check: user not found" });

    if (user?.subscription === false || user?.payAsGo === false)
      return resReturn(res, 222, { err: " subscription ended." });

    if (bulks === "undefined" || !bulks || bulks.length === 0)
      return resReturn(res, 222, { err: "bulks not sended" });
    if (user.credit < bulks.length)
      return resReturn(res, 222, { err: "have not enough credits" });

    for (const email of bulks) {
      console.log(email);
      checkEmail(email, async (result) => {
        if (!res.headersSent) {
          console.log(`Result for ${email}: ${result}`);
          // res.send({ email, result });
          const data = result;
        }
        const smtp = data.exists;
        result = [...result, data];

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
      });
    }
    return resReturn(res, 200, { result });
  } catch (error) {
    resReturn(res, 222, { err: error.message });
  }
};
