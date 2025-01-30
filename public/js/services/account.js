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

      if (!response.ok) {
        throw new Error("Failed to fetch account details");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching account details:", err.message);
    }
  },
  deleteAccount: async () => {
    try{
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: localStorage.getItem("token") },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching account details:", err.message);
    }
  },
}

export default accountService;
