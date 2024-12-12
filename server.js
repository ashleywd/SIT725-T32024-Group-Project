require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const { appRoutes, authRoutes } = require("./routes/");
const { handleError, handle404 } = require("./controllers/appController");
const { connectDB } = require("./config/db");

// Set our server port
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set the view engine
app.set('view engine', 'ejs');

// Use the router
app.use("/", appRoutes);
app.use("/api/auth", authRoutes);

// Error handlers
app.use(handleError);
app.use(handle404);

// Start the server
app.listen(port, () => {
  console.log(`App listening to: ${port}`);
});
