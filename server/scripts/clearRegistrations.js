const mongoose = require("mongoose");
require("dotenv").config();

const Registration = require("../models/Registration");

(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Deleting all registrations...");
    await Registration.deleteMany({});

    console.log("✔ All registrations cleared.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();