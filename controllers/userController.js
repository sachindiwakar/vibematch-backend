const { prisma } = require("../config/database");
const { USER_SAFE_DATA } = require("../utils/userSafeData");

// Get all pending/received connection requests
const getReceivedRequests = async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await prisma.connectionRequest.findMany({
      where: {
        toUserId: loggedInUser.id,
        status: "interested",
      },

      include: {
        fromUser: {
          select: USER_SAFE_DATA,
        },
      },
    });

    return res.status(200).json({
      message: "Connection requests received",
      data: connectionRequests,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// Get all connections of logged-in user
const getConnections = async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await prisma.connectionRequest.findMany({
      where: {
        OR: [
          {
            toUserId: loggedInUser.id,
            status: "accepted",
          },
          {
            fromUserId: loggedInUser.id,
            status: "accepted",
          },
        ],
      },

      include: {
        fromUser: {
          select: USER_SAFE_DATA,
        },

        toUser: {
          select: USER_SAFE_DATA,
        },
      },
    });

    const data = connectionRequests.map((row) => {
      if (row.fromUserId === loggedInUser.id) {
        return row.toUser;
      }

      return row.fromUser;
    });

    return res.status(200).json({
      message: "Your list of connections",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// User Feed
const getUserFeed = async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Pagination
    const page = parseInt(req.query.page) || 1;

    let limit = parseInt(req.query.limit) || 10;

    limit = limit > 50 ? 50 : limit;

    const skip = (page - 1) * limit;

    // Find all connection requests
    const connectionRequests = await prisma.connectionRequest.findMany({
      where: {
        OR: [
          {
            fromUserId: loggedInUser.id,
          },
          {
            toUserId: loggedInUser.id,
          },
        ],
      },

      select: {
        fromUserId: true,
        toUserId: true,
      },
    });

    // Users to hide from feed
    const hideUsersFromFeed = new Set();

    connectionRequests.forEach((connection) => {
      hideUsersFromFeed.add(connection.fromUserId);
      hideUsersFromFeed.add(connection.toUserId);
    });

    // Hide logged-in user too
    hideUsersFromFeed.add(loggedInUser.id);

    // Feed Users
    const feedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(hideUsersFromFeed),
        },
      },

      select: USER_SAFE_DATA,

      skip,

      take: limit,
    });

    return res.status(200).json({
      message: "Feed fetched successfully",
      data: feedUsers,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  getReceivedRequests,
  getConnections,
  getUserFeed,
};
