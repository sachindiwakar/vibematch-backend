const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.use("/", (req, res) => {
  res.send("Server is Live");
});

app.listen(PORT, () => {
  console.log("Server is running on PORT", PORT);
});
