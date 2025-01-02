const socketController = {
  handleEvents: function(socket, io){
    const userId = socket.request.userId;;
    socket.join(userId);
    socket.on("send-offer", (data) => {
      io.to(data.postedBy._id).emit("receive-offer", { userId, data });
    });
  },
};

module.exports = socketController;
