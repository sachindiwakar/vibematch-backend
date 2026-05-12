const express = require("express");
const cors = require("cors");
require("dotenv/config");
const cookieParser = require("cookie-parser");

const app = express();

const PORT = process.env.PORT;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is Live.");
});

const authRouter = require("./routes/authRoutes");
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log("Server is running...");
});
