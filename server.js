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
const jwt = require("jsonwebtoken");

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

io.engine.use((req, _, next) => {
  const isHandshake = req._query.sid === undefined;
  if (!isHandshake) {
    return next();
  }

  const token = req.headers["authorization"];
  jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("invalid token"));
    }
    req.userId = decoded.userId;
    next();
  });
});

const usersConnected = new Map();

io.on("connection", (socket) => {
  // the user ID is used as a room
  console.log({ userId: socket.request.userId });
});
