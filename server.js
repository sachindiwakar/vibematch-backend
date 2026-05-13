const express = require("express");
const cors = require("cors");
require("dotenv/config");
const cookieParser = require("cookie-parser");

const app = express();

const PORT = process.env.PORT;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is Live.");
});

const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
app.use("/auth", authRouter);
app.use("/user", userRouter);

app.listen(PORT, () => {
  console.log("Server is running...");
});
