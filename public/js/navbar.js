const loginMenu = document.querySelector("#login-menu");
const registerMenu = document.querySelector("#register-menu");
const logoutMenu = document.querySelector("#logout-menu");
const dashboardMenu = document.querySelector("#dashboard-menu");

const toggleUnnecessaryMenu = () => {
  loginMenu.style.display = "none";
  registerMenu.style.display = "none";
  dashboardMenu.style.display = "block";
  logoutMenu.style.display = "block";
};

const checkAuth = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  toggleUnnecessaryMenu();
};

checkAuth();

const logout = (e) => {
  e.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "/";
};

logoutMenu.addEventListener("click", logout);
