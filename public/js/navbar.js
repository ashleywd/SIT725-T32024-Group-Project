const loginMenu = document.querySelectorAll("#login-menu");
const registerMenu = document.querySelectorAll("#register-menu");
const logoutMenu = document.querySelectorAll("#logout-menu");
const dashboardMenu = document.querySelectorAll("#dashboard-menu");
const accountMenu = document.querySelectorAll("#account-menu");
const myPostsMenu = document.querySelectorAll("#my-posts-menu");

const toggleUnnecessaryMenu = () => {
  loginMenu.forEach((menu) => menu.style.display = "none")
  registerMenu.forEach((menu) => menu.style.display = "none");
  dashboardMenu.forEach((menu) => menu.style.display = "block");
  myPostsMenu.forEach((menu) => menu.style.display = "block");
  logoutMenu.forEach((menu) => menu.style.display = "block");
  accountMenu.forEach((menu) => menu.style.display = "block");
};

const logout = (e) => {
  e.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "/";
};

logoutMenu.forEach((menu) => menu.addEventListener("click", logout));

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

const initializeNotificationsMenu = async () => {
  try {
    const notificationElements = document.querySelectorAll('.dropdown-trigger');
    const notificationIcon = document.querySelector('.notifications-icon');
    const notificationContainer = document.querySelector('#notifications-container');

    const notifications = await getNotifications();
    if (notifications?.length > 0) {
      notificationIcon.textContent = "notifications_active";
      notifications.forEach((notification) => {
        /*
        <li><a href="#!">
        */
        const notificationElement = document.createElement('li');
        const notificationLink = document.createElement('a');
        notificationLink.href = "#!";
        notificationLink.textContent = notification.description;
        notificationElement.appendChild(notificationLink);
        notificationContainer.appendChild(notificationElement);
      });
    }

    M.Dropdown.init(notificationElements, {
      constrainWidth: false,
      coverTrigger: false,
    });
  } catch (err) {
    console.error("Error initializing notifications menu:", err.message);
  }
};

initializeNotificationsMenu();

export {
  toggleUnnecessaryMenu,
};
