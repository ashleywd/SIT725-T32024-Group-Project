const loginMenu = document.querySelectorAll("#login-menu");
const registerMenu = document.querySelectorAll("#register-menu");
const logoutMenu = document.querySelectorAll("#logout-menu");
const dashboardMenu = document.querySelectorAll("#dashboard-menu");
const accountMenu = document.querySelectorAll("#account-menu");
const myPostsMenu = document.querySelectorAll("#my-posts-menu");
const notificationsMenu = document.querySelectorAll("#notifications-menu");
const pointsDisplay = document.querySelectorAll("#pointsBadge");

const toggleUnnecessaryMenu = () => {
  loginMenu.forEach((menu) => menu.style.display = "none")
  registerMenu.forEach((menu) => menu.style.display = "none");
  dashboardMenu.forEach((menu) => menu.style.display = "block");
  myPostsMenu.forEach((menu) => menu.style.display = "block");
  logoutMenu.forEach((menu) => menu.style.display = "block");
  accountMenu.forEach((menu) => menu.style.display = "block");
  notificationsMenu.forEach((menu) => menu.style.display = "block");
  pointsDisplay.forEach((menu) => (menu.style.display = "block"));
};

const logout = (e) => {
  e.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "/";
};

logoutMenu.forEach((menu) => menu.addEventListener("click", logout));

export {
  toggleUnnecessaryMenu,
};
