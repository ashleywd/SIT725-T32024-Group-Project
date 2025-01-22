const getNotifications = async () => {
  try {
    const token = localStorage.getItem("token");

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
    return data;
  } catch (err) {
    console.error("Error fetching notifications:", err.message);
    return [];
  }
};

const createPersistentNotification = async (
  userId,
  message,
  token,
  baseUrl
) => {
  try {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ userId, message }),
    });

    if (!response.ok) {
      throw new Error("Failed to create persistent notification");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating persistent notification:", error);
    throw error;
  }
};

const createToastNotification = (message, classes = "green") => {
  M.toast({ html: message, classes });
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

const createPostNotification = async (
  post,
  userId,
  token,
  options = { toast: true, persistent: true }
) => {
  try {
    const dateTime = new Date(post.dateTime).toLocaleString();
    const userToken = token || localStorage.getItem("token");
    const currentUserId =
      userId || JSON.parse(atob(userToken.split(".")[1])).userId;
    const isCreator = currentUserId === post.postedBy;
    const isAcceptor = currentUserId === post.acceptedBy;

    // Define notification case key
    const notificationKey = `${post.status}_${post.type}_${
      isCreator ? "creator" : "acceptor"
    }`;

    // Map of notification messages
    const persistentNotifications = {
      // Creation notifications
      created_offer_creator: `You have created a new babysitting offer for ${dateTime}.`,
      created_request_creator: `You have created a new babysitting request for ${dateTime}. ${post.hoursNeeded} points have been deducted from your account.`,

      // Edit notifications
      edited_offer_creator: `You have updated your babysitting offer for ${dateTime}.`,
      edited_request_creator: `You have updated your babysitting request for ${dateTime}.${
        post.pointDifference !== 0
          ? ` ${Math.abs(post.pointDifference)} points have been ${
              post.pointDifference > 0 ? "deducted" : "refunded"
            }.`
          : ""
      }`,

      // Accepted notifications
      accepted_offer_creator: `Your babysitting offer for ${dateTime} has been accepted`,
      accepted_offer_acceptor: `You have accepted a babysitting offer for ${dateTime}. ${post.hoursNeeded} points have been deducted from your account.`,
      accepted_request_creator: `Your request for a babysitter on ${dateTime} has been accepted`,
      accepted_request_acceptor: `You have accepted to provide babysitting on ${dateTime}`,

      // Completed notifications
      completed_offer_creator: `Your babysitting offer for ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`,
      completed_offer_acceptor: `The babysitting offer you accepted for ${dateTime} has been completed.`,
      completed_request_creator: `Your babysitting request for ${dateTime} has been completed.`,
      completed_request_acceptor: `The babysitting session you provided on ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`,

      // Cancelled notifications
      cancelled_offer_creator: `You have cancelled your offer post for ${dateTime}.`,
      cancelled_offer_acceptor: `The babysitting offer you accepted for ${dateTime} has been cancelled. ${post.hoursNeeded} points have been refunded.`,
      cancelled_request_creator: `You have cancelled your request post for ${dateTime}. ${post.hoursNeeded} points have been refunded.`,
      cancelled_request_acceptor: `The babysitting request you accepted for ${dateTime} has been cancelled.`,
    };

    const toastNotifications = {
      // Creation notifications (user creates)
      created_offer_creator: "Babysitting offer created successfully",
      created_request_creator: "Babysitting request created successfully",

      // Edit notifications (user edits)
      edited_offer_creator: "Offer updated successfully",
      edited_request_creator: "Request updated successfully",

      // Accept notifications (user accepts)
      accepted_offer_acceptor: "Offer accepted successfully",
      accepted_request_acceptor: "Request accepted successfully",

      // Complete notifications (user completes)
      completed_offer_creator: "Offer marked as completed",
      completed_request_acceptor: "Request marked as completed",

      // Cancel notifications (user cancels)
      cancelled_offer_creator: "Offer cancelled",
      cancelled_request_creator: "Request cancelled",
    };

    const persistentMessage = persistentNotifications[notificationKey];
    const toastMessage = toastNotifications[notificationKey];

    if (persistentMessage && options.persistent) {
      await createPersistentNotification(
        currentUserId,
        persistentMessage,
        userToken,
        window.location.origin
      );
    }

    if (toastMessage && options.toast) {
      createToastNotification(toastMessage);
    }
  } catch (error) {
    console.error("Error creating notifications:", error);
    throw error;
  }
};

// const handleStatusNotification = (updatedPost) => {
//   const dateTime = new Date(updatedPost.dateTime).toLocaleString();
//   const currentUserId = JSON.parse(
//     atob(localStorage.getItem("token").split(".")[1])
//   ).userId;

//   // For edits, only show notification to post creator
//   if (updatedPost.type === "edit" && currentUserId !== updatedPost.postedBy) {
//     return; // Exit early if it's an edit and user is not the creator
//   }

//   // For other status changes, notify both creator and acceptor
//   if (
//     currentUserId === updatedPost.postedBy ||
//     currentUserId === updatedPost.acceptedBy
//   ) {
//     const isPostCreator = currentUserId === updatedPost.postedBy;
//     const isPostAcceptor = currentUserId === updatedPost.acceptedBy;

//     const toastMessage = getStatusMessage(
//       updatedPost,
//       isPostCreator,
//       isPostAcceptor,
//       dateTime
//     );

//     if (toastMessage) {
//       M.toast({
//         html: toastMessage,
//         classes: "green",
//       });
//     }
//   }
// };

// const notificationService = {
//   async createStatusNotification(userId, message, token) {
//     return await createNotification(
//       userId,
//       message,
//       token,
//       window.location.origin
//     );
//   },

//   async createPointsNotification(userId, points, reason, token) {
//     const message =
//       points > 0
//         ? `${points} points have been credited for ${reason}.`
//         : `${Math.abs(points)} points have been deducted for ${reason}.`;

//     return await createNotification(
//       userId,
//       message,
//       token,
//       window.location.origin
//     );
//   },
// };

export {
  displayNotifications,
  getNotifications,
  createPostNotification,
  createPersistentNotification,
  createToastNotification,
  deleteNotification,
  updateStatusToSeen,
};
