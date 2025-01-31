import { clearTokenAndRedirectToLogin } from "../global.js";

const postsService = {
  createPost: async (formData) => {
    try{
      const userToken = localStorage.getItem("token");
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: userToken,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error("Error creating post");
    }
  },
  getPosts: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/posts", {
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
      console.error("Failed to fetch posts:", error);
      throw new Error("Error fetching posts");
    }
  },
  updatePostStatus: async (postId, postedBy, status) => {
    try {
      const userToken = localStorage.getItem("token");
      const response = await fetch(`/api/posts/status/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: userToken,
        },
        body: JSON.stringify({ postId, postedBy, status }),
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to update post status:", error);
      throw new Error("Error fetching posts");
    }
  },
  getPostById: async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/posts/${postId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          method: "GET",
        },
      });

      if (!response.ok && response.status === 401) {
        clearTokenAndRedirectToLogin();
      }

      const post = await response.json();
      return post;
    } catch (error) {
      console.error("Error fetching post:", error);
      throw new Error("Error fetching post");
    }
  },
};

export default postsService;
