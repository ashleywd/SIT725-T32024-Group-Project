const getNotifications = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/notifications", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err.message);
  }
};

const deleteNotification = async (notificationId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to delete notification");
    }
  } catch (err) {
    console.error("Error deleting notification:", err.message);
  }
};

const updateStatusToSeen = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/notifications/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to delete notification");
    }
  } catch (err) {
    console.error("Error deleting notification:", err.message);
  }
};

const handleDeleteNotification = async (e) => {
  try {
    e.preventDefault();
    // Get the parent li element that contains the notification
    const notificationItem = e.target.closest(".notification-item");

    // Get the delete button which should have the data attribute
    const deleteButton = notificationItem.querySelector(".delete-notification");

    const notificationId = deleteButton.dataset.notificationId;

    await deleteNotification(notificationId);
    displayNotifications();
  } catch (err) {
    console.error("Error deleting notification:", err);
    M.toast({ html: "Failed to delete notification", classes: "red" });
  }
};

const deleteButtonIcon = (notificationId) => {
  const deleteButton = document.createElement("a");
  deleteButton.dataset.notificationId = notificationId;
  deleteButton.innerHTML = '<i class="material-icons">delete</i>';
  deleteButton.classList.add("delete-notification", "center");
  deleteButton.addEventListener("click", handleDeleteNotification);

  return deleteButton;
};

const addNotificationToMenu = (notifications) => {
  const notificationsContainer = document.querySelector(
    "#notifications-container"
  );
  notificationsContainer.innerHTML = "";

  if (!notifications.length) {
    const emptyMessage = document.createElement("li");
    emptyMessage.classList.add("no-notifications");
    emptyMessage.textContent = "No notifications to display";
    notificationsContainer.appendChild(emptyMessage);
    return;
  }

  notifications.forEach((notification) => {
    const notificationElement = document.createElement("li");
    const notificationMessage = document.createElement("p");
    notificationElement.classList.add("notification-item");
    notificationMessage.classList.add("notification-text");
    notificationMessage.textContent = notification.message;
    notificationElement.appendChild(notificationMessage);
    notificationElement.appendChild(deleteButtonIcon(notification._id));
    notificationsContainer.appendChild(notificationElement);
  });
};

const growingEffect = (element) => {
  element.classList.add("grow");
  setTimeout(() => {
    element.classList.remove("grow");
  }, 1000);
};

const triggerNewNotificationEffect = (notifications) => {
  const notificationIcon = document.querySelector(".notifications-icon");
  const unseenNotification = notifications.find(
    (notification) => notification.status === "new"
  );
  if (!unseenNotification) return;

  notificationIcon.textContent = "notifications_active";
  growingEffect(notificationIcon);
};

const handleOnOpenStart = async () => {
  try {
    await updateStatusToSeen();
    const notificationIcon = document.querySelector(".notifications-icon");
    notificationIcon.textContent = "notifications_none";
  } catch (e) {
    console.error("Error handleOnOpenStart:", err.message);
  }
};

const displayNotifications = async () => {
  try {
    const notificationElements = document.querySelectorAll(".dropdown-trigger");
    const notifications = await getNotifications();

    triggerNewNotificationEffect(notifications);
    addNotificationToMenu(notifications);

    M.Dropdown.init(notificationElements, {
      constrainWidth: false,
      coverTrigger: false,
      onOpenStart: handleOnOpenStart,
    });
  } catch (err) {
    console.error("Error initializing notifications menu:", err.message);
  }
};

const handleStatusNotification = (updatedPost, type) => {
  let toastMessage;
  const dateTime = new Date(updatedPost.dateTime).toLocaleString();
  const currentUserId = JSON.parse(
    atob(localStorage.getItem("token").split(".")[1])
  ).userId;

  // Only show notification if user is involved with the post
  const isPostCreator = updatedPost.postedBy === currentUserId;
  const isPostAcceptor = updatedPost.acceptedBy === currentUserId;

  if (!isPostCreator && !isPostAcceptor) {
    return; // Exit if user hasn't interacted with this post
  }

  if (updatedPost.status === "accepted") {
    if (updatedPost.type === "offer") {
      if (isPostCreator) {
        toastMessage = `Your babysitting offer for ${dateTime} has been accepted`;
      }
      if (isPostAcceptor) {
        toastMessage = `You have accepted a babysitting offer for ${dateTime}. ${updatedPost.hoursNeeded} points have been deducted from your account.`;
      }
    } else {
      if (isPostCreator) {
        toastMessage = `Your request for a babysitter on ${dateTime} has been accepted`;
      }
    }
  } else if (updatedPost.status === "completed") {
    if (updatedPost.type === "offer" && isPostCreator) {
      toastMessage = `Your babysitting offer for ${dateTime} has been completed and ${updatedPost.hoursNeeded} points have been credited to your account.`;
    } else if (updatedPost.type === "request" && isPostAcceptor) {
      toastMessage = `The babysitting session you provided on ${dateTime} has been completed and ${updatedPost.hoursNeeded} points have been credited to your account.`;
    }
  } else if (updatedPost.status === "cancelled") {
    if (updatedPost.type === "offer") {
      if (isPostAcceptor) {
        toastMessage = `The babysitting offer you accepted for ${dateTime} has been cancelled. ${updatedPost.hoursNeeded} points have been refunded.`;
      }
    } else {
      if (isPostAcceptor) {
        toastMessage = `The babysitting request you accepted for ${dateTime} has been cancelled.`;
      }
    }
  }

  if (toastMessage) {
    M.toast({
      html: toastMessage,
      classes: "green",
    });
  }
};

export { displayNotifications, handleStatusNotification };
