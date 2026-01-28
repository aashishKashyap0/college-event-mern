const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User");

const MONGO_URI = "mongodb+srv://aashish:Aashish123@college-event-cluster.8lp8qrp.mongodb.net/college_event";

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    await User.deleteMany(); // optional but good for clean seed

    const passwordHash = await bcrypt.hash("password123", 10);

    const users = [
      {
        name: "Student User",
        email: "student@college.edu",
        passwordHash,
        role: "STUDENT"
      },
      {
        name: "Coordinator User",
        email: "coordinator@college.edu",
        passwordHash,
        role: "COORDINATOR"
      },
      {
        name: "HOD User",
        email: "hod@college.edu",
        passwordHash,
        role: "HOD"
      }
    ];

    await User.insertMany(users);

    console.log("✅ Demo users inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
