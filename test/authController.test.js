const authController = require("../controllers//authController");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

jest.mock("../models/user");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const req = { body: { username: "newuser", password: "password123", email: "new@example.com" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      User.findOne.mockResolvedValue(null); // No conflicts
      bcrypt.hash.mockResolvedValue("hashedPassword");
      User.prototype.save = jest.fn().mockResolvedValue({ _id: "userId" });
      jwt.sign.mockReturnValue("mockToken");

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(User.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered successfully",
        token: "mockToken",
      });
    });

    it("should return error if username already exists", async () => {
      const req = { body: { username: "existinguser", password: "password123", email: "test@example.com" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      User.findOne.mockResolvedValue({ username: "existinguser" });

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ username: "existinguser" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Username is already taken" });
    });

    it("should return error if email already exists", async () => {
        const req = { body: { username: "newuser", password: "password123", email: "existing@example.com" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      
        User.findOne
          .mockResolvedValueOnce(null) // Username check
          .mockResolvedValueOnce({ email: "existing@example.com" }); // Email conflict
      
        await authController.register(req, res);
      
        expect(User.findOne).toHaveBeenNthCalledWith(1, { username: "newuser" });
        expect(User.findOne).toHaveBeenNthCalledWith(2, { email: "existing@example.com" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Email is already registered" });
    });
      

    it("should return error if password is too short", async () => {
        const req = { body: { username: "testuser", password: "123", email: "test@example.com" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      
        User.findOne.mockResolvedValue(null); // No conflicts for username or email
      
        await authController.register(req, res);
      
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Password must be at least 6 characters long" });
    });
      

    it("should handle unexpected errors", async () => {
      const req = { body: { username: "newuser", password: "password123", email: "new@example.com" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      User.findOne.mockRejectedValue(new Error("Database error"));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Registration failed" });
    });
  });

  describe("login", () => {
    it("should log in successfully with valid credentials", async () => {
      const req = { body: { username: "testuser", password: "password123" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      User.findOne.mockResolvedValue({ _id: "userId", password: "hashedPassword" });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockToken");

      await authController.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ username: "testuser" });
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedPassword");
      expect(jwt.sign).toHaveBeenCalledWith({ userId: "userId" }, process.env.SESSION_SECRET, { expiresIn: "1h" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: "mockToken" });
    });

    it("should return error if username or password is invalid", async () => {
      const req = { body: { username: "testuser", password: "wrongpassword" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      User.findOne.mockResolvedValue({ _id: "userId", password: "hashedPassword" });
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid username or password" });
    });

    it("should handle unexpected errors", async () => {
      const req = { body: { username: "testuser", password: "password123" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      User.findOne.mockRejectedValue(new Error("Database error"));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Login failed" });
    });
  });
});
