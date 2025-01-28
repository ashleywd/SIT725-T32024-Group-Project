const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../../models/user"); // Adjust the path to your User model

const SESSION_SECRET = process.env.SESSION_SECRET;
// In testUtils.js
const testPassword = process.env.TEST_USER_PASSWORD || "TestPassword!123";


// Function to insert a test user into the database and generate a token
async function insertTestUser(username, password) {
  try {
     const user = new User({
      username,
      password,
      email: `${username}@example.com`, // Add a valid email address
    });

    await user.save();
    console.log("Test user created successfully:", user);
    const token = jwt.sign({ userId: user._id }, SESSION_SECRET, {
            expiresIn: "1h",
          });
    return { user, token: token }; 
  } catch (error) {
    console.error("Error inserting test user:", error);
    throw error;
  }
}

module.exports = { insertTestUser };