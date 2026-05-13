const express = require("express");
const { userAuth } = require("../middlewares/auth");

const {
  viewProfile,
  editProfile,
  requestDeleteAccount,
  verifyDeleteAccount,
} = require("../controllers/profileController");

const profileRouter = express.Router();

profileRouter.get("/view", userAuth, viewProfile);
profileRouter.patch("/edit", userAuth, editProfile);
profileRouter.post("/request/delete-account", userAuth, requestDeleteAccount);
profileRouter.delete("/verify/delete-account", verifyDeleteAccount);

module.exports = profileRouter;
