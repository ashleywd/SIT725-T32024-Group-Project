const Post = require("../models/post");

const postController = {
  createPost: async (req, res) => {
    try {
      const { type, hoursNeeded, description, dateTime } = req.body;
      // Use userId from auth middleware
      const userId = req.userId;

      const newPost = new Post({
        postedBy: userId,
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
  getAllPosts: async (req, res) => {
    try {
      const posts = await Post.find({
        postedBy: { $ne: req.userId }, // Exclude current user's posts
      }).populate({ path: "postedBy", select: "username" });

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
          { postedBy: req.userId }, // Posts created by user
        ],
      })
        .populate({ path: "postedBy", select: "username" })
        .sort({ createdAt: -1 });

      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res
        .status(500)
        .json({ message: "Error fetching user posts", error: error.message });
    }
  },
  updatePostStatus: async (req, res) => {
    try {
      const { postId, postedBy, status } = req.body;
      const userId = req.userId;
      const post = await Post.findById(postId);

      if (!post) {
        return res
          .status(404)
          .json({ message: "Post not found", error: "Post not found" });
      }

      const io = req.app.get("io");
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          status,
          acceptedBy: status === "accepted" ? userId : post.acceptedBy,
        },
        { new: true },
      );

      const notifyUser = status === "accepted" ? postedBy._id : post.acceptedBy;

      io.to(notifyUser.toString()).emit("notify-post-status-update", {
        updatedPost,
      });

      res.status(201).json({ updatedPost });
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Error updating post status", error });
    }
  },
};

module.exports = postController;
