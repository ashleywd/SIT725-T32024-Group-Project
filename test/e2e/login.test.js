const path = require('path');
const User = require('../../models/user');
const { test, expect } = require("@playwright/test");
const mongoose = require("mongoose");
const { insertTestUser } = require("./utils/testUtils"); 

// Define the test block
test.describe("Login Functionality", () => {
  let token;

  // Before each test: Reset database and insert a test user
  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.title !== "should load the login page") {
      try {
        console.log("Clearing the User collection...");
        await User.deleteMany({});
        console.log("User collection cleared successfully.");
  
        const { user, token: generatedToken } = await insertTestUser("testUser", "password123");
        console.log("Test user inserted:", user);
        token = generatedToken;
      } catch (error) {
        console.error("Error during beforeEach setup:", error);
        throw error;
      }
    }
  
    // Navigate to the login page for all tests
    await page.goto("/login");
  });
  

  // After all tests: Clear the database and close the database connection
test.afterAll(async () => {
  try {
    await User.deleteMany({});
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error during afterAll cleanup:", error);
  }
});

  // Test if the login page loads successfully
test("should load the login page", async ({ page }) => {
  const title = await page.title();
  expect(title).toBe("Login");

  await expect(page.locator("#username")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

  // Test login with valid credentials
  test("should log in successfully with valid credentials", async ({ page }) => {
    await page.fill("#username", "testUser");
    await page.fill("#password", "password123");

    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");
    const url = page.url();
    expect(url).toBe("http://localhost:3000/dashboard");
  });

  // Test login with invalid credentials
  test("should show error message for invalid credentials", async ({ page }) => {
    await page.fill("#username", "invalidUsername");
    await page.fill("#password", "invalidPassword");

    await page.click('button[type="submit"]');

    await expect(page.locator(".error-message")).toBeVisible();
    const errorText = await page.textContent(".error-message");
    expect(errorText).toBe("Invalid username or password.");
  });

  // Test login with missing username
  test("should show error message for missing username", async ({ page }) => {
    await page.fill("#password", "password123");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error-message")).toBeVisible();
    const errorText = await page.textContent(".error-message");
    expect(errorText).toBe("Username and password are required.");
  });

  // Test login with missing password
  test("should show error message for missing password", async ({ page }) => {
    await page.fill("#username", "testUser");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error-message")).toBeVisible();
    const errorText = await page.textContent(".error-message");
    expect(errorText).toBe("Username and password are required.");
  });
});
