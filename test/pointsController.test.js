const pointsController = require("../controllers/pointsController");
const User = require("../models/user");
const httpMocks = require("node-mocks-http");

jest.mock("../models/user");

describe("pointsController", () => {
  describe("getPoints", () => {
    it("should return user points if user exists", async () => {
      const req = httpMocks.createRequest({
        userId: "12345",
      });
      const res = httpMocks.createResponse();

      User.findById.mockResolvedValue({ points: 50 });

      await pointsController.getPoints(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ points: 50 });
    });

    it("should return 404 if user is not found", async () => {
      const req = httpMocks.createRequest({ userId: "12345" });
      const res = httpMocks.createResponse();

      User.findById.mockResolvedValue(null);

      await pointsController.getPoints(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({ error: "User not found" });
    });

    it("should return 500 if unknown error occurs", async () => {
      const req = httpMocks.createRequest({ userId: "12345" });
      const res = httpMocks.createResponse();

      User.findById.mockRejectedValue(new Error("Database error"));

      await pointsController.getPoints(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: "Internal server error" });
    });
  });

  describe("updatePoints", () => {
    it("should update user points and return new total", async () => {
      const req = httpMocks.createRequest({
        body: { points: 10, recipientId: "12345" },
      });
      const res = httpMocks.createResponse();

      User.findByIdAndUpdate.mockResolvedValue({ points: 60 });

      await pointsController.updatePoints(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ points: 60, message: "Points updated successfully" });
    });

    it("should return 404 if user to update is not found", async () => {
      const req = httpMocks.createRequest({
        body: { points: 10, recipientId: "12345" },
      });
      const res = httpMocks.createResponse();

      User.findByIdAndUpdate.mockResolvedValue(null);

      await pointsController.updatePoints(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({ error: "User not found" });
    });

    it("should return 500 if unknown error occurs", async () => {
      const req = httpMocks.createRequest({
        body: { points: 10, recipientId: "12345" },
      });
      const res = httpMocks.createResponse();

      User.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

      await pointsController.updatePoints(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: "Internal server error" });
    });
  });
});
