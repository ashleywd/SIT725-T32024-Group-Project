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

  if (updatedPost.status === "accepted") {
    if (updatedPost.type === "offer") {
      toastMessage = `Your babysitting offer for ${dateTime} has been accepted`;
    } else {
      toastMessage = `Your request for a babysitter on ${dateTime} has been accepted`;
    }
  } else if (updatedPost.status === "completed") {
    if (updatedPost.type === "offer") {
      toastMessage = `Your babysitting offer for ${dateTime} has been marked as completed. ${updatedPost.hoursNeeded} points credited.`;
    } else {
      toastMessage = `The babysitting session you provided on ${dateTime} has been marked as completed. ${updatedPost.hoursNeeded} points credited.`;
    }
  }

  M.toast({
    html: toastMessage,
    classes: "green",
  });
};

export { displayNotifications, handleStatusNotification };
