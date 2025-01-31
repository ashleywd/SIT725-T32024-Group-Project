import { clearTokenAndRedirectToLogin } from "../global.js";

const myPostsService = {
  getMyPosts: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/posts/my-posts", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const posts = await response.json();
      return posts;
    } catch (error) {
      console.error("Failed to fetch my posts:", error);
      throw new Error("Failed to fetch my posts");
    }
  },
};

export default myPostsService;
