const jwt = require("jsonwebtoken");

const { prisma } = require("../config/database");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    // Check Token
    if (!token) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Verify Token
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    const { id } = decodedObj;

    // Find User
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Attach User to Request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message || "Authentication failed",
    });
  }
};

module.exports = {
  userAuth,
};
