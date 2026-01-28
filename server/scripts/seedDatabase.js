// ========================================
// FILE: server/scripts/seedDatabase.js
// ========================================
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

// Import models
const User = require("../models/User");
const Auditorium = require("../models/Auditorium");

const MONGO_URI = process.env.MONGO_URI;

const seedDatabase = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    console.log("🧹 Clearing old data...");
    await User.deleteMany({});
    await Auditorium.deleteMany({});

    console.log("👤 Creating sample users...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    await User.insertMany([
      {
        name: "John Student",
        email: "student@college.edu",
        passwordHash: hashedPassword,         // ✅ correct field name
        role: "STUDENT",
        department: "Computer Science"
      },
      {
        name: "Sarah Coordinator",
        email: "coordinator@college.edu",
        passwordHash: hashedPassword,         // ✅ correct field name
        role: "COORDINATOR",
        department: "Computer Science"
      },
      {
        name: "Dr. Smith HOD",
        email: "hod@college.edu",
        passwordHash: hashedPassword,         // ✅ correct field name
        role: "HOD",
        department: "Computer Science"
      }
    ]);

    console.log("👥 Sample users created!");

    console.log("🏛️ Creating sample auditoriums...");

    await Auditorium.insertMany([
      {
        name: "Main Auditorium",
        capacity: 500,
        location: "Building A, Ground Floor",
        facilities: ["Projector", "Sound System", "AC", "Stage"]
      },
      {
        name: "Seminar Hall 1",
        capacity: 150,
        location: "Building B, First Floor",
        facilities: ["Projector", "Whiteboard", "AC"]
      },
      {
        name: "Open Air Theatre",
        capacity: 300,
        location: "Campus Grounds",
        facilities: ["Stage", "Sound System", "Lighting"]
      }
    ]);

    console.log("🎉 Auditorium data inserted successfully!");

    console.log("\n===============================");
    console.log(" SEEDING COMPLETED SUCCESSFULLY ");
    console.log("===============================\n");

    console.log("👇 USE THESE LOGIN CREDENTIALS:");
    console.log("STUDENT:     student@college.edu    / password123");
    console.log("COORDINATOR: coordinator@college.edu / password123");
    console.log("HOD:         hod@college.edu        / password123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
};

seedDatabase();
