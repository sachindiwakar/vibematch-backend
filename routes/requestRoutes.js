const express = require("express");
const { userAuth } = require("../middlewares/auth");

const {
  sendConnectionRequest,
  reviewConnectionRequest,
} = require("../controllers/requestController");

const requestRouter = express.Router();

requestRouter.post("/send/:status/:toUserId", userAuth, sendConnectionRequest);
requestRouter.post(
  "/review/:status/:requestId",
  userAuth,
  reviewConnectionRequest,
);

module.exports = requestRouter;
