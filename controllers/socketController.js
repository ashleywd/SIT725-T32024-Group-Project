const PostController = require("../controllers/postController");

const socketController = {
  handleConnection: function(socket){
    const userId = socket.request.userId;
    socket.join(userId);
  },
};

module.exports = socketController;
