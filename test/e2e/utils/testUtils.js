const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/User"); // Adjust the path to your User model

const SESSION_SECRET = process.env.SESSION_SECRET;
// In testUtils.js
const testPassword = process.env.TEST_USER_PASSWORD || "TestPassword!123";


// Function to insert a test user into the database and generate a token
const insertTestUser = async (username, plainPassword) => {
  try {

    const passwordHash = await bcrypt.hash(testPassword, 10);

    const user = new User({
      username,
      password: passwordHash,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, SESSION_SECRET, {
      expiresIn: "1h", // Token valid for 1 hour
    });

    console.log("Test user inserted successfully:", user);
    console.log("Generated JWT token:", token);
    
    return { user, token };
  } catch (error) {
    console.error("Error inserting test user:", error);
    throw error;
  }
};

module.exports = { insertTestUser };
