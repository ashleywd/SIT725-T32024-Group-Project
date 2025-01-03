verifyUserAuthentication();

const populateData = (data) => {
  document.getElementById("accountName").value = data.name;
  document.getElementById("accountEmail").value = data.email;
  document.getElementById("accountPoints").innerText = data.points;
};

const fetchAccountDetails = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/account", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch account details");
    }

    const data = await response.json();

    populateData(data);
  } catch (err) {
    console.error("Error fetching account details:", err.message);
    var instance = M.Modal.getInstance(document.getElementById("errorModal"));
    instance.open();
  }
};

const accountDetails = document.getElementById("accountDetails");
const editAccountBtn = document.getElementById("editAccountBtn");
const accountBtns = document.getElementById("accountBtns");
const editBtns = document.getElementById("editBtns");

const toggleAccountDetails = () => {
  const emailField = document.getElementById("accountEmail");
  emailField.disabled = !emailField.disabled;
  accountBtns.classList.toggle("hide");
  editBtns.classList.toggle("hide");
};

editAccountBtn.addEventListener("click", () => {
  toggleAccountDetails();
});

accountDetails.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("accountEmail").value.trim();

  // Validate email field to make sure it is not empty
  if (email === "") {
    M.toast({
      html: "Please provide a new email address.",
      classes: "red",
    });
    return;
  }

  const formData = new FormData(e.target);
  const body = JSON.stringify(Object.fromEntries(formData));

  try {
    const response = await fetch("/api/account", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
      body,
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Update failed");

    M.toast({ html: "Account updated successfully!" });
    fetchAccountDetails();
    toggleAccountDetails();
  } catch (error) {
    console.error("Update error:", error);
    M.toast({ html: error.message, classes: "red" });
  }
});

const cancelBtn = document.getElementById("cancelBtn");

cancelBtn.addEventListener("click", () => {
  toggleAccountDetails();
  fetchAccountDetails();
});

const deleteAccountBtn = document.getElementById("deleteAccountBtn");
deleteAccountBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to delete your account?")) return;

  try {
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { Authorization: localStorage.getItem("token") },
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Deletion failed");

    M.toast({ html: "Account deleted successfully!" });
    window.location.href = "/login";
  } catch (error) {
    console.error("Deletion error:", error);
    M.toast({ html: error.message, classes: "red" });
  }
});

// Fetch account details on page load
fetchAccountDetails();
