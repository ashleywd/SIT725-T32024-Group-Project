const initializeMaterializeComponent = () => {
  // Initialize Materialize components
  var elems = document.querySelectorAll("select");
  M.FormSelect.init(elems);

  var modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);
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
