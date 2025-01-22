const initializeWebSocket = () => {
  const userToken = localStorage.getItem("token");

  const socket = io({
    extraHeaders: {
      authorization: userToken,
    },
  });

  return socket;
};

const activateWebSocket = ({ handleNotifyAcceptPost, handlePostsUpdated }) => {
  const socket = initializeWebSocket();
  if (handleNotifyAcceptPost)
    socket.on("notify-post-status-update", handleNotifyAcceptPost);

  if (handlePostsUpdated) socket.on("posts-updated", handlePostsUpdated);
};

export { activateWebSocket };
