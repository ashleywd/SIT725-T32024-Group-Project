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

const handlePostCreated = () => {
  M.toast({
    html: `New post created`,
    classes: "green",
  });
  if (window.location.href.includes("dashboard")) {
    getPosts?.();
  }
};

const handlePostEdited = () => {
  M.toast({
    html: `Post edited`,
    classes: "blue",
  });
  if (window.location.href.includes("dashboard")) {
    getPosts?.();
  }
};

const handlePostDeleted = () => {
  M.toast({
    html: `Post deleted`,
    classes: "red",
  });
  if (window.location.href.includes("dashboard")) {
    getPosts?.();
  }
};

const handlePostCompleted = () => {
  M.toast({
    html: `Post completed`,
    classes: "green",
  });
  if (window.location.href.includes("dashboard")) {
    getPosts?.();
  }
};

const activateWebSocket = () => {
  const socket = initializeWebSocket();
  socket.on("notify-post-status-update", handleNotifyAcceptPost);
  socket.on("post-created", handlePostCreated);
  socket.on("post-edited", handlePostEdited);
  socket.on("post-deleted", handlePostDeleted);
  socket.on("post-completed", handlePostCompleted);
};
