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

const fetchUserPoints = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/account/points", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok && response.status === 401) {
      clearTokenAndRedirectToLogin();
      throw new Error("Failed to fetch user points");
    }

    const data = await response.json();
    const pointsBadge = document.getElementById("pointsBadge");
    const points = data.points;
    pointsBadge.innerText = `${points} pts`;
  } catch (err) {
    console.error("Error fetching user points:", err.message);
  }
};

export {
  toggleUnnecessaryMenu,
  fetchUserPoints
};
