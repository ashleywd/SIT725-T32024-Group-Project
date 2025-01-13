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

const handlePostsUpdated = () => {
  if (window.location.href.includes("dashboard")) {
    // Let's not refresh the page every time a post is updated because it will affect the user experience.
    // Maybe we can refresh the notification badge instead.
    // getPosts?.();
  }
};

const activateWebSocket = () => {
  const socket = initializeWebSocket();
  socket.on("notify-post-status-update", handleNotifyAcceptPost);
  socket.on("posts-updated", handlePostsUpdated);
};
