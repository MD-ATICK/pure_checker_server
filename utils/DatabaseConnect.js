const { default: mongoose } = require("mongoose");

exports.databaseConnect = async () => {
  try {
    const { connection } = await mongoose.connect(
      "mongodb+srv://gmailchecker:gmailchecker@cluster0.1ijj0j1.mongodb.net",
      { dbName: "email_checker" }
    );
    console.log(`✅ connected to ${connection.host}`);
  } catch (error) {
    console.log(error.message);
  }
};
