const postController = require("../controllers/postController");
const Post = require("../models/post");
const Notification = require("../models/notification");

jest.mock("../models/post");
jest.mock("../models/notification");

describe("Post Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      userId: "mockUserId123",
      app: {
        get: jest.fn().mockReturnValue({ emit: jest.fn() }),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("createPost", () => {
    it("should create a new post successfully", async () => {
      req.body = {
        type: "offer",
        hoursNeeded: 4,
        description: "Test task",
        dateTime: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockSavedPost = {
        ...req.body,
        postedBy: req.userId,
        _id: "mockPostId123",
        status: "open",
      };

      Post.prototype.save = jest.fn().mockResolvedValue(mockSavedPost);

      await postController.createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSavedPost);
    });

    it("should reject invalid post type", async () => {
      req.body = {
        type: "invalid_type",
        hoursNeeded: 4,
        description: "Test task",
        dateTime: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockError = {
        errors: {
          type: { message: "Invalid type value" },
        },
      };

      Post.prototype.save = jest.fn().mockRejectedValue(mockError);

      await postController.createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error creating post",
        error: mockError.errors.type.message,
      });
    });
  });

  describe("getAllPosts", () => {
    it("should fetch all posts excluding current user's posts", async () => {
      const mockPosts = [{ _id: "post1", postedBy: { username: "user1" } }];
      Post.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPosts),
      });

      await postController.getAllPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPosts);
    });

    it("should handle errors during fetching posts", async () => {
      Post.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Fetch error")),
      });

      await postController.getAllPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching posts",
        error: "Fetch error",
      });
    });
  });

  describe("getUserPosts", () => {
    it("should fetch user's posts", async () => {
      const mockUserPosts = [{ _id: "post1", postedBy: { username: "user1" } }];
      Post.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUserPosts),
        }),
      });

      await postController.getUserPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUserPosts);
    });

    it("should handle errors during fetching user posts", async () => {
      Post.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error("Fetch error")),
        }),
      });

      await postController.getUserPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching user posts",
        error: "Fetch error",
      });
    });
  });

  describe("updatePostStatus", () => {
    it("should update post status successfully", async () => {
      const mockPost = {
        _id: "post1",
        acceptedBy: null,
        postedBy: {
          _id: "otherUserId",
          toString: () => "otherUserId",
        },
      };
      const mockUpdatedPost = {
        ...mockPost,
        status: "accepted",
        acceptedBy: req.userId,
      };
      const mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };

      req.body = {
        postId: "post1",
        status: "accepted",
        postedBy: { _id: "otherUserId" },
      };
      req.app.get.mockReturnValue(mockIo);

      Post.findById = jest.fn().mockResolvedValue(mockPost);
      Post.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedPost);

      await postController.updatePostStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ updatedPost: mockUpdatedPost });
      expect(mockIo.to).toHaveBeenCalledWith("otherUserId");
      expect(mockIo.emit).toHaveBeenCalledWith("notify-post-status-update", {
        updatedPost: mockUpdatedPost,
        type: "accepted",
      });
    });

    it("should handle errors during post status update", async () => {
      req.body = { postId: "post1", status: "accepted" };
      Post.findById = jest.fn().mockRejectedValue(new Error("Update error"));

      await postController.updatePostStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error updating post status",
        error: new Error("Update error"),
      });
    });
  });
});
