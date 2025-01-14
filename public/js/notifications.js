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

const addNotificationToMenu = (notifications) => {
  const notificationsContainer = document.querySelector('#notifications-container');
  notificationsContainer.innerHTML = "";

  notifications.forEach((notification) => {
    const notificationElement = document.createElement('li');
    const notificationLink = document.createElement('a');
    notificationLink.href = "#!";
    notificationLink.textContent = notification.message;
    notificationElement.appendChild(notificationLink);
    notificationsContainer.appendChild(notificationElement);
  });
};

const displayNotifications = async () => {
  try {
    const notificationElements = document.querySelectorAll('.dropdown-trigger');
    const notificationIcon = document.querySelector('.notifications-icon');
    const notifications = await getNotifications();
    if (notifications?.length > 0) {
      notificationIcon.textContent = "notifications_active";
      addNotificationToMenu(notifications);
    }

    M.Dropdown.init(notificationElements, {
      constrainWidth: false,
      coverTrigger: false,
    });
  } catch (err) {
    console.error("Error initializing notifications menu:", err.message);
  }
};

export {
  displayNotifications,
};
