// src/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["STUDENT", "COORDINATOR", "HOD"],
      default: "STUDENT",
    },
    department: {
      type: String, // optional for HOD/COORDINATOR
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
