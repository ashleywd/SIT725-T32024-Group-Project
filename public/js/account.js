checkAuth();
// Initialize Materialize components
var elems = document.querySelectorAll("select");
var instances = M.FormSelect.init(elems);

// Initialize modals
var modals = document.querySelectorAll(".modal");
M.Modal.init(modals);

// Fetch Account Details
async function fetchAccountDetails() {
    const response = await fetch('/account');
    const data = await response.json();
    document.getElementById('accountName').innerText = data.name;
    document.getElementById('accountEmail').innerText = data.email;
    document.getElementById('accountPoints').innerText = data.points;
}

// Update Account
document.getElementById('updateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = JSON.stringify(Object.fromEntries(formData));
    const response = await fetch('/account', { method: 'PUT', body, headers: { 'Content-Type': 'application/json' }});
    const result = await response.json();
    alert(result.message);
    fetchAccountDetails();
});

// Delete Account
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const response = await fetch('/account', { method: 'DELETE' });
    const result = await response.json();
    alert(result.message);
    window.location.href = '/login'; // Redirect to login page
});

// Load initial data
fetchAccountDetails();