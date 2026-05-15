const express = require("express");
const cors = require("cors");
require("dotenv/config");
const cookieParser = require("cookie-parser");

const http = require("http");
const initializeSocket = require("./services/socket");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Server Check Route
app.get("/", (req, res) => {
  res.send("Server is Live.");
});

// Routes
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const profileRouter = require("./routes/profileRoutes");
const requestRouter = require("./routes/requestRoutes");
const chatRouter = require("./routes/chatRoutes");

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/chat", chatRouter);

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
