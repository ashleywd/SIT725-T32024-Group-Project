import { verifyUserAuthentication } from "../global.js";

const pointsService = {
  updatePoints: async (points, recipientId) => {
    try {
      if (!recipientId) throw new Error("recipientId is required");
      const response = await fetch("/api/points", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          points,
          recipientId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update points");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating points:", error);
    }
  },
  getPoints: async () => {
    try {
      const response = await fetch("/api/points", {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get points");
      }

      const result = await response.json();
      return result.points;
    } catch (error) {
      console.error("Error getting points:", error);
    }
  },
};

export default pointsService;
