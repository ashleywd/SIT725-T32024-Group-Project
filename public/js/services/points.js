import { clearTokenAndRedirectToLogin } from "../global.js";

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

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating points:", error);
      throw new Error("Error updating points");
    }
  },
  getPoints: async () => {
    try {
      const response = await fetch("/api/points", {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const result = await response.json();
      return result.points;
    } catch (error) {
      console.error("Error getting points:", error);
      throw new Error("Error getting points");
    }
  },
};

export default pointsService;
