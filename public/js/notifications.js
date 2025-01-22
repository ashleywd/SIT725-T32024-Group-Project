const getNotifications = async () => {
  try {
    const token = localStorage.getItem("token");
    console.log("Fetching notifications...");

    const response = await fetch("/api/notifications", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();
    console.log("Fetched notifications:", data);
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err.message);
    return [];
  }
};

const createNotification = async (userId, message, token, baseUrl) => {
  try {
    console.log("Creating notification:", { userId, message });

    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        userId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create notification");
    }

    const result = await response.json();
    console.log("Notification created:", result);
    return result;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
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
    throw err;
  }
};

const updateStatusToSeen = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to update notification status");
    }
  } catch (err) {
    console.error("Error updating notification status:", err.message);
    throw err;
  }
};

const handleDeleteNotification = async (e) => {
  try {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    const notificationItem = e.target.closest(".notification-item");
    const deleteButton = notificationItem.querySelector(".delete-notification");
    const notificationId = deleteButton.dataset.notificationId;

    await deleteNotification(notificationId);

    // Immediately refresh notifications and reinitialize dropdown
    const notificationElements = document.querySelectorAll(".dropdown-trigger");
    const notifications = await getNotifications();

    // Update notifications list
    triggerNewNotificationEffect(notifications);
    addNotificationToMenu(notifications);

    // Reinitialize dropdown but keep it open
    const instance = M.Dropdown.init(notificationElements, {
      constrainWidth: false,
      coverTrigger: false,
      onOpenStart: handleOnOpenStart,
    });

    // Keep dropdown open after deletion
    if (instance[0]) {
      instance[0].open();
    }
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

  if (!notifications?.length) {
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
  setTimeout(() => element.classList.remove("grow"), 1000);
};

const triggerNewNotificationEffect = (notifications) => {
  const notificationIcon = document.querySelector(".notifications-icon");

  // Check for unread notifications directly from notifications array
  const hasUnread = notifications?.some(
    (notification) => notification.status === "new"
  );

  // Update icon based on unread status
  notificationIcon.textContent = hasUnread
    ? "notifications_active"
    : "notifications_none";

  if (hasUnread) {
    growingEffect(notificationIcon);
  }
};

const handleOnOpenStart = async () => {
  try {
    await updateStatusToSeen();
    const notificationIcon = document.querySelector(".notifications-icon");
    notificationIcon.textContent = "notifications_none";
  } catch (err) {
    console.error("Error in handleOnOpenStart:", err.message);
  }
};

const displayNotifications = async () => {
  try {
    console.log("Displaying notifications...");
    const notificationElements = document.querySelectorAll(".dropdown-trigger");
    const notifications = await getNotifications();
    console.log("Notifications to display:", notifications);

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

const getStatusMessage = (post, isCreator, isAcceptor, dateTime) => {
  const messageKey = `${post.status}_${post.type}_${
    isCreator ? "creator" : "acceptor"
  }`;

  switch (messageKey) {
    case "accepted_offer_creator":
      return `Your babysitting offer for ${dateTime} has been accepted`;

    case "accepted_offer_acceptor":
      return `You have accepted a babysitting offer for ${dateTime}. ${post.hoursNeeded} points have been deducted from your account.`;

    case "accepted_request_creator":
      return `Your request for a babysitter on ${dateTime} has been accepted`;

    case "accepted_request_acceptor":
      return `You have accepted to provide babysitting on ${dateTime}`;

    case "completed_offer_creator":
      return `Your babysitting offer for ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`;

    case "completed_offer_acceptor":
      return `The babysitting offer you accepted for ${dateTime} has been completed.`;

    case "completed_request_creator":
      return `Your babysitting request for ${dateTime} has been completed.`;

    case "completed_request_acceptor":
      return `The babysitting session you provided on ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`;

    case "cancelled_offer_creator":
      return `You have cancelled your offer post for ${dateTime}.`;

    case "cancelled_offer_acceptor":
      return `The babysitting offer you accepted for ${dateTime} has been cancelled. ${post.hoursNeeded} points have been refunded.`;

    case "cancelled_request_creator":
      return `You have cancelled your request post for ${dateTime}. ${post.hoursNeeded} points have been refunded.`;

    case "cancelled_request_acceptor":
      return `The babysitting request you accepted for ${dateTime} has been cancelled.`;

    default:
      return null;
  }
};

const handleStatusNotification = (updatedPost) => {
  const dateTime = new Date(updatedPost.dateTime).toLocaleString();
  const currentUserId = JSON.parse(
    atob(localStorage.getItem("token").split(".")[1])
  ).userId;

  // For edits, only show notification to post creator
  if (updatedPost.type === "edit" && currentUserId !== updatedPost.postedBy) {
    return; // Exit early if it's an edit and user is not the creator
  }

  // For other status changes, notify both creator and acceptor
  if (
    currentUserId === updatedPost.postedBy ||
    currentUserId === updatedPost.acceptedBy
  ) {
    const isPostCreator = currentUserId === updatedPost.postedBy;
    const isPostAcceptor = currentUserId === updatedPost.acceptedBy;

    const toastMessage = getStatusMessage(
      updatedPost,
      isPostCreator,
      isPostAcceptor,
      dateTime
    );

    if (toastMessage) {
      M.toast({
        html: toastMessage,
        classes: "green",
      });
    }
  }
};

const notificationService = {
  async createStatusNotification(userId, message, token) {
    return await createNotification(
      userId,
      message,
      token,
      window.location.origin
    );
  },

  async createPointsNotification(userId, points, reason, token) {
    const message =
      points > 0
        ? `${points} points have been credited for ${reason}.`
        : `${Math.abs(points)} points have been deducted for ${reason}.`;

    return await createNotification(
      userId,
      message,
      token,
      window.location.origin
    );
  },
};

export {
  displayNotifications,
  handleStatusNotification,
  createNotification,
  getNotifications,
  notificationService,
};
