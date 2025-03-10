const express = require("express");
const router = express.Router();
const appController = require("../controllers/appController");

// Basic route handlers
router.get("/", appController.renderHome);
router.get("/dashboard", appController.renderDashboard);
router.get("/my-posts", appController.renderMyPosts);
router.get("/login", appController.renderLogin);
router.get("/register", appController.renderRegister);
router.get('/account', appController.renderAccount);

module.exports = router;
