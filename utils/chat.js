const generateChatKey = (userId1, userId2) => {
  return [userId1, userId2].sort().join("_");
};

module.exports = {
  generateChatKey,
};
