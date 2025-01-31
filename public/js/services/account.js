import { clearTokenAndRedirectToLogin } from "../global.js";

const accountService = {
  getAccountDetails: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/account", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching account details:", err.message);
      throw new Error("Error fetching account details");
    }
  },
  getAccountDetailsByUserId: async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/account/details/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching account details:", err.message);
      throw new Error("Error fetching account details");
    }
  },
  deleteAccount: async () => {
    try{
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: localStorage.getItem("token") },
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error deleting account:", err.message);
      throw new Error("Error deleting account");
    }
  },
}

export default accountService;
