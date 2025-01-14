import { toggleUnnecessaryMenu } from "./navbar.js";

const initializeMaterializeComponent = () => {
  // Initialize Materialize components
  const selects = document.querySelectorAll("select");
  M.FormSelect.init(selects);

  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);

  const sidenav = document.querySelectorAll(".sidenav");
  M.Sidenav.init(sidenav);
};

const verifyUserAuthentication = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  // Actions for when users are authenticated
  toggleUnnecessaryMenu();
};

const clearTokenAndRedirectToLogin = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

const getStatusColor = (status) => {
  const colors = {
    open: "blue",
    accepted: "orange",
    completed: "green",
    cancelled: "red",
  };
  return colors[status] || "grey";
};

export {
  initializeMaterializeComponent,
  verifyUserAuthentication,
  clearTokenAndRedirectToLogin,
  getStatusColor,
};
