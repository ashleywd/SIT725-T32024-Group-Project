const Post = require("../models/post");

const postController = {
  createPost: async (req, res) => {
    try {
      const { type, hoursNeeded, description, dateTime } = req.body;
      // Use userId from auth middleware
      const userId = req.userId;

      const newPost = new Post({
        userId,
        type,
        hoursNeeded,
        description,
        dateTime,
      });

      const savedPost = await newPost.save();
      res.status(201).json(savedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res
        .status(500)
        .json({ message: "Error creating post", error: error.message });
    }
  },
  getAllPosts: async (_, res) => {
    try {
      const posts = await Post.find();
      res.status(200).json(posts);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching posts", error: error.message });
    }
  },
  getUserPosts: async (req, res) => {
    try {
      const posts = await Post.find({
        $or: [
          { userId: req.userId }, // Posts created by user
        ],
      })
        .populate("userId", "username")
        .sort({ createdAt: -1 });

      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res
        .status(500)
        .json({ message: "Error fetching user posts", error: error.message });
    }
  },
};

module.exports = postController;
