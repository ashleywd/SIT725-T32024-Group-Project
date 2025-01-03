const initializeMaterializeComponent = () => {
  // Initialize Materialize components
  const selects = document.querySelectorAll("select");
  M.FormSelect.init(selects);

  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);

  const sidenav = document.querySelectorAll('.sidenav');
  M.Sidenav.init(sidenav);
};

initializeMaterializeComponent();

const verifyUserAuthentication = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  // Actions for when users are authenticated
  toggleUnnecessaryMenu();
  fetchUserPoints();
};

const clearTokenAndRedirectToLogin = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};
