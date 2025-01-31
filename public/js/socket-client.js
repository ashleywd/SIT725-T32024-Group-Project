import { verifyUserAuthentication } from "./global.js";

const initializeWebSocket = () => {
  const userToken = localStorage.getItem("token");

  const socket = io({
    extraHeaders: {
      authorization: userToken,
    },
  });

  return socket;
};

const activateWebSocket = ({
  handleNotifyAcceptPost,
  handlePostsUpdated
}) => {
  const socket = initializeWebSocket();

  socket.on("connect_error", () => {
    verifyUserAuthentication();
  });

  if (handleNotifyAcceptPost)
    socket.on("notify-post-status-update", handleNotifyAcceptPost);

  if (handlePostsUpdated)
    socket.on("posts-updated", handlePostsUpdated);
};

export { activateWebSocket };
