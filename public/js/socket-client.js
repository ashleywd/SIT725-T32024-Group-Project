const initializeWebSocket = () => {
  const userToken = localStorage.getItem("token");

  const socket = io({
    extraHeaders: {
      authorization: userToken,
    },
  });

  return socket;
};

const handleNotifyAcceptPost = (data) => {
  const operation = data.updatedPost.status;
  M.toast({
    html: `Post ${data.updatedPost.description} ${operation}.`,
    classes: "green",
  });

  if (window.location.href.includes("dashboard")) {
    getPosts?.();
  } else if (window.location.href.includes("my-posts")) {
    getMyPosts?.();
  }
};

const activateWebSocket = () => {
  const socket = initializeWebSocket();
  socket.on("notify-post-status-update", handleNotifyAcceptPost);
};
