const loginMenu = document.querySelector("#login-menu");
const registerMenu = document.querySelector("#register-menu");
const logoutMenu = document.querySelector("#logout-menu");
const dashboardMenu = document.querySelector("#dashboard-menu");
const accountMenu = document.querySelector("#account-menu");
const myPostsMenu = document.querySelector("#my-posts-menu");

const toggleUnnecessaryMenu = () => {
  loginMenu.style.display = "none";
  registerMenu.style.display = "none";
  dashboardMenu.style.display = "block";
  myPostsMenu.style.display = "block";
  logoutMenu.style.display = "block";
  accountMenu.style.display = "block";
};

const logout = (e) => {
  e.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "/";
};

logoutMenu.addEventListener("click", logout);

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
