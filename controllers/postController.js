const Post = require("../models/post");
const Notification = require("../models/notification");
const pointsController = require("./pointsController");
const notificationController = require("./notificationController");

const postController = {
  createPost: async (req, res) => {
    try {
      const io = req.app.get("io");
      const { type, hoursNeeded, description, dateTime } = req.body;
      const userId = req.userId;

      const selectedDate = new Date(dateTime);
      if (selectedDate < new Date()) {
        return res.status(400).json({
          message: "Cannot set date/time in the past",
        });
      }

      // Create notification for post owner (for both types)
      await notificationController.createNotification(
        {
          body: {
            userId: req.userId,
            message: `You have created a new ${type} post for ${new Date(
              dateTime
            ).toLocaleString()}.`,
          },
        },
        { status: () => ({ json: () => {} }) }
      );

      if (type === "request") {
        try {
          await pointsController.handleRequestPoints(userId, hoursNeeded);
          await notificationController.notifyPointsChange(
            userId,
            -hoursNeeded,
            "your babysitting request"
          );
        } catch (error) {
          return res.status(400).json({ message: error.message });
        }
      }

      // Create and save the post
      const newPost = new Post({
        postedBy: userId,
        type,
        hoursNeeded,
        description,
        dateTime,
      });
      const savedPost = await newPost.save();

      // Notify other users
      io.emit("posts-updated");

      res.status(201).json(savedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        message: "Error creating post",
        error: error.message,
      });
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

  getPostById: async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await Post.findById(postId);
      res.status(200).json(post);
    } catch (error) {
      console.error("Error fetching post by id:", error);
      res
        .status(500)
        .json({ message: "Error fetching post by id", error: error.message });
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

  editPost: async (req, res) => {
    try {
      const io = req.app.get("io");
      const { postId } = req.params;
      const { type, hoursNeeded, description, dateTime } = req.body;
      const userId = req.userId;

      // Get original post
      const originalPost = await Post.findById(postId);

      // Validate hours change
      if (type === "request" && hoursNeeded !== originalPost.hoursNeeded) {
        const pointDifference = hoursNeeded - originalPost.hoursNeeded;

        if (pointDifference > 0) {
          try {
            await pointsController.handleRequestPoints(userId, pointDifference);
            await notificationController.notifyPointsChange(
              userId,
              -pointDifference,
              "updating your babysitting request"
            );
          } catch (error) {
            return res.status(400).json({ message: error.message });
          }
        } else if (pointDifference < 0) {
          await pointsController.updatePoints(userId, -pointDifference);
          await notificationController.notifyPointsChange(
            userId,
            Math.abs(pointDifference),
            "reducing hours in your babysitting request"
          );
        }
      }

      // Validate date

      const selectedDate = new Date(dateTime);
      if (selectedDate < new Date()) {
        return res.status(400).json({
          message: "Cannot set date/time in the past",
        });
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { type, hoursNeeded, description, dateTime },
        { new: true }
      ).populate({ path: "postedBy", select: "username" });

      io.emit("posts-updated");

      res.status(200).json(updatedPost);
    } catch (error) {
      console.error("Error editing post:", error);
      res
        .status(500)
        .json({ message: "Error editing post", error: error.message });
    }
  },

  cancelPost: async (req, res) => {
    try {
      const io = req.app.get("io");
      const { postId } = req.params;

      const post = await Post.findOneAndUpdate(
        {
          _id: postId,
          postedBy: req.userId,
          status: { $nin: ["cancelled", "completed"] },
        },
        { status: "cancelled" },
        { new: true }
      );

      // Handle request cancellations
      if (post.type === "request") {
        await pointsController.updatePoints(req.userId, post.hoursNeeded);

        // Create notification for post owner about cancellation
        await notificationController.createNotification(
          {
            body: {
              userId: req.userId,
              message: `You have cancelled your ${
                post.type
              } post for ${new Date(post.dateTime).toLocaleString()}.`,
            },
          },
          { status: () => ({ json: () => {} }) }
        );

        // Notify creator about refund
        await notificationController.notifyPointsChange(
          req.userId,
          post.hoursNeeded,
          "cancelling your babysitting request"
        );

        // Notify acceptor about cancellation
        if (post.acceptedBy) {
          await notificationController.notifyStatusChange(
            post.acceptedBy,
            post,
            "cancelled"
          );

          io.to(post.acceptedBy.toString()).emit("notify-post-status-update", {
            updatedPost: post,
            type: "cancel",
          });
        }
      } else if (post.type === "offer") {
        // Create notification for post owner about cancellation
        await notificationController.createNotification(
          {
            body: {
              userId: req.userId,
              message: `You have cancelled your ${
                post.type
              } post for ${new Date(post.dateTime).toLocaleString()}.`,
            },
          },
          { status: () => ({ json: () => {} }) }
        );

        if (post.acceptedBy) {
          await pointsController.updatePoints(
            post.acceptedBy,
            post.hoursNeeded
          );

          // Notify acceptor about cancellation status
          await notificationController.notifyStatusChange(
            post.acceptedBy,
            post,
            "cancelled"
          );

          // Notify acceptor about refund
          await notificationController.notifyPointsChange(
            post.acceptedBy,
            post.hoursNeeded,
            "the cancelled babysitting offer"
          );

          io.to(post.acceptedBy.toString()).emit("notify-post-status-update", {
            updatedPost: post,
            type: "cancel",
          });
        }
      }

      // Emit socket events for post owner
      io.to(req.userId.toString()).emit("notify-post-status-update", {
        updatedPost: post,
      });

      io.emit("posts-updated");

      res.status(200).json({
        message: "Post cancelled successfully",
        post,
      });
    } catch (error) {
      console.error("Error cancelling post:", error);
      res
        .status(500)
        .json({ message: "Error cancelling post", error: error.message });
    }
  },

  updatePostStatus: async (req, res) => {
    try {
      const { postId, postedBy, status } = req.body;
      const userId = req.userId;
      const post = await Post.findById(postId);

      // Handle acceptances
      if (status === "accepted") {
        // Create status notifications
        await notificationController.notifyStatusChange(
          post.postedBy,
          post,
          status
        );
        if (post.acceptedBy) {
          await notificationController.notifyStatusChange(
            post.acceptedBy,
            post,
            status
          );
        }
        // Handle points for accepting
        if (post.type === "offer") {
          try {
            // Notification for accepting an offer
            await notificationController.createNotification(
              {
                body: {
                  userId: userId,
                  message: `You have accepted a babysitting offer for ${new Date(
                    post.dateTime
                  ).toLocaleString()}.`,
                },
              },
              { status: () => ({ json: () => {} }) }
            );

            await pointsController.handleOfferPoints(userId, post.hoursNeeded);
            await notificationController.notifyPointsChange(
              userId,
              -post.hoursNeeded,
              "accepting a babysitting offer"
            );
          } catch (error) {
            return res.status(400).json({ message: error.message });
          }
        } else {
          // Notification for accepting a request
          await notificationController.createNotification(
            {
              body: {
                userId: userId,
                message: `You have accepted to provide babysitting on ${new Date(
                  post.dateTime
                ).toLocaleString()}.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );
        }
      }

      // Handle completions
      if (status === "completed") {
        // Create status notifications
        await notificationController.notifyStatusChange(
          post.postedBy,
          post,
          status
        );
        if (post.acceptedBy) {
          await notificationController.notifyStatusChange(
            post.acceptedBy,
            post,
            status
          );
        }

        // Handle points for completion
        if (post.type === "offer") {
          await pointsController.updatePoints(post.postedBy, post.hoursNeeded);
          await notificationController.notifyPointsChange(
            post.postedBy,
            post.hoursNeeded,
            "completing your babysitting offer"
          );
        } else if (post.type === "request") {
          await pointsController.updatePoints(
            post.acceptedBy,
            post.hoursNeeded
          );
          await notificationController.notifyPointsChange(
            post.acceptedBy,
            post.hoursNeeded,
            "completing the babysitting session"
          );
        }
      }

      // Update post status
      const io = req.app.get("io");
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          status,
          acceptedBy: status === "accepted" ? userId : post.acceptedBy,
        },
        { new: true }
      );

      // Emit socket events
      io.to(post.postedBy.toString()).emit("notify-post-status-update", {
        updatedPost,
        type: status,
      });
      if (post.acceptedBy) {
        io.to(post.acceptedBy.toString()).emit("notify-post-status-update", {
          updatedPost,
          type: status,
        });
      }
      io.emit("posts-updated");

      res.status(201).json({ updatedPost });
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ message: "Error updating post status", error });
    }
  },
};

module.exports = postController;
