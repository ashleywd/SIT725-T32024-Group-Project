require("dotenv").config();
const express = require("express");
const path = require("node:path");
const app = express();
const engine = require("ejs-mate");
const { handleError, handle404 } = require("./controllers/appController");
const {
  appRoutes,
  authRoutes,
  postRoutes,
  accountRoutes,
} = require("./routes/");
const { connectDB } = require("./config/db");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const verifyToken = require("./middleware/socketMiddleware");
const { handleEvents } = require("./controllers/socketController");

connectDB();
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set the view engine
app.engine("ejs", engine);
app.set("view engine", "ejs");

// Set routes
app.use("/", appRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

// Error handlers
app.use(handleError);
app.use(handle404);

// Start the server
server.listen(port, () => {
  console.log(`App listening to: ${port}`);
});

// Setup socket io
io.engine.use(verifyToken);
io.on("connection", (socket) => {
  handleEvents(socket, io);
});
