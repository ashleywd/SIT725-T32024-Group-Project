const User = require("../models/user");
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

      if (type === "request") {
        const hasEnoughPoints = await pointsController.checkPoints(
          userId,
          hoursNeeded
        );
        if (!hasEnoughPoints) {
          return res.status(400).json({
            message: "You do not have enough points to create this request.",
          });
        }
        // Single point deduction
        await pointsController.updatePoints(userId, -hoursNeeded);
        await notificationController.createNotification(
          {
            body: {
              userId: userId,
              message: `${hoursNeeded} points have been deducted for your babysitting request.`,
            },
          },
          { status: () => ({ json: () => {} }) }
        );
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

      if (type === "request") {
        const pointDifference = hoursNeeded - originalPost.hoursNeeded;
        if (pointDifference > 0) {
          const hasEnoughPoints = await pointsController.checkPoints(
            userId,
            pointDifference
          );
          if (!hasEnoughPoints) {
            return res.status(400).json({
              message: "You do not have enough points to update this request.",
            });
          }
          // Deduct additional points
          await pointsController.updatePoints(userId, -pointDifference);

          // Notify about point deduction
          await notificationController.createNotification(
            {
              body: {
                userId: userId,
                message: `${pointDifference} additional points have been deducted for your updated babysitting request.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );
        } else if (pointDifference < 0) {
          // Refund points if hoursNeeded is reduced
          await pointsController.updatePoints(userId, -pointDifference);

          // Notify about point refund
          await notificationController.createNotification(
            {
              body: {
                userId: userId,
                message: `${Math.abs(
                  pointDifference
                )} points have been refunded due to reducing hours in your babysitting request.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );
        }
      }

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

      // Refund points if it's a request post
      if (post.type === "request") {
        await pointsController.updatePoints(req.userId, post.hoursNeeded);
      } else if (post.type === "offer" && post.acceptedBy) {
        // Refund points to the user who accepted the offer
        await pointsController.updatePoints(post.acceptedBy, post.hoursNeeded);
      }

      // Create notification for the other party if post was accepted
      if (post.acceptedBy) {
        const notificationMessage = `The ${
          post.type
        } post that you accepted for ${new Date(
          post.dateTime
        ).toLocaleString()} has been cancelled.${
          post.type === "offer"
            ? ` ${post.hoursNeeded} points have been refunded to your account.`
            : ""
        }`;

        const newNotification = new Notification({
          userId: post.acceptedBy,
          message: notificationMessage,
          isGlobal: false,
        });
        await newNotification.save();

        // Emit socket events for notification and toast
        io.to(post.acceptedBy.toString()).emit("notify-post-status-update", {
          updatedPost: post,
          type: "cancel",
        });
      }

      // Create notification for post owner as well
      const ownerNotificationMessage = `You have cancelled your ${
        post.type
      } post for ${new Date(post.dateTime).toLocaleString()}.${
        post.type === "request"
          ? ` ${post.hoursNeeded} points have been refunded to your account.`
          : ""
      }`;

      const ownerNotification = new Notification({
        userId: req.userId,
        message: ownerNotificationMessage,
        isGlobal: false,
      });
      await ownerNotification.save();

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

      // Handle points for accepting
      if (status === "accepted") {
        if (post.type === "offer") {
          const hasEnoughPoints = await pointsController.checkPoints(
            userId,
            post.hoursNeeded
          );
          if (!hasEnoughPoints) {
            return res
              .status(400)
              .json({ message: "Not enough points to accept offer" });
          }
          await pointsController.updatePoints(userId, -post.hoursNeeded);
        }
      }

      // Handle points for completion
      if (status === "completed") {
        if (post.type === "offer") {
          // For offer posts: award points to the post owner (who did the babysitting)
          await pointsController.updatePoints(post.postedBy, post.hoursNeeded);
        } else if (post.type === "request") {
          // For request posts: award points to the acceptedBy user (who did the babysitting)
          await pointsController.updatePoints(
            post.acceptedBy,
            post.hoursNeeded
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

      // Create notifications based on status
      if (status === "accepted") {
        if (post.type === "offer") {
          // Notify creator
          await notificationController.createNotification(
            {
              body: {
                userId: post.postedBy,
                message: `Your babysitting offer for ${new Date(
                  post.dateTime
                ).toLocaleString()} has been accepted.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );

          // Notify acceptor
          await notificationController.createNotification(
            {
              body: {
                userId: userId,
                message: `You have accepted a babysitting offer for ${new Date(
                  post.dateTime
                ).toLocaleString()}. ${
                  post.hoursNeeded
                } points have been deducted from your account.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );
        } else {
          // Notify request creator
          await notificationController.createNotification(
            {
              body: {
                userId: post.postedBy,
                message: `Your request for a babysitter on ${new Date(
                  post.dateTime
                ).toLocaleString()} has been accepted.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );

          // Notify acceptor
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
      } else if (status === "completed") {
        if (post.type === "offer") {
          // Notify creator
          await notificationController.createNotification(
            {
              body: {
                userId: post.postedBy,
                message: `Your babysitting offer for ${new Date(
                  post.dateTime
                ).toLocaleString()} has been marked as completed. ${
                  post.hoursNeeded
                } points have been credited to your account.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );

          // Notify acceptor
          await notificationController.createNotification(
            {
              body: {
                userId: post.acceptedBy,
                message: `The babysitting offer you accepted for ${new Date(
                  post.dateTime
                ).toLocaleString()} has been completed.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );
        } else {
          // Notify request creator
          await notificationController.createNotification(
            {
              body: {
                userId: post.postedBy,
                message: `Your babysitting request for ${new Date(
                  post.dateTime
                ).toLocaleString()} has been completed.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );

          // Notify acceptor
          await notificationController.createNotification(
            {
              body: {
                userId: post.acceptedBy,
                message: `The babysitting session you provided on ${new Date(
                  post.dateTime
                ).toLocaleString()} has been marked as completed. ${
                  post.hoursNeeded
                } points have been credited to your account.`,
              },
            },
            { status: () => ({ json: () => {} }) }
          );
        }
      }

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
