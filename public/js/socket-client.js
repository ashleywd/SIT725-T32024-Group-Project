const initializeWebSocket = () => {
  const userToken = localStorage.getItem("token");

  const socket = io("ws://localhost:3000", {
    extraHeaders: {
      authorization: userToken,
    },
  });

  return socket;
};
