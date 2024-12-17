checkAuth();
var elems = document.querySelectorAll("select");
M.FormSelect.init(elems);

var modals = document.querySelectorAll(".modal");
M.Modal.init(modals);

const fetchAccountDetails = async () => {
    try {
        const response = await fetch('/account', {
            headers: { Authorization: localStorage.getItem('token') },
        });
        const data = await response.json();

        document.getElementById('accountName').innerText = data.name;
        document.getElementById('accountEmail').innerText = data.email;
        document.getElementById('accountPoints').innerText = data.points;
    } catch (error) {
        console.error('Failed to fetch account details', error);
        M.toast({ html: 'Error fetching account details', classes: 'red' });
    }
};

document.getElementById('updateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const body = JSON.stringify(Object.fromEntries(formData));

    try {
        const response = await fetch('/account', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('token'),
            },
            body,
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Update failed');

        M.toast({ html: 'Account updated successfully!' });
        fetchAccountDetails(); // Refresh the account details
    } catch (error) {
        console.error('Update error:', error);
        M.toast({ html: error.message, classes: 'red' });
    }
});

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your account?')) return;

    try {
        const response = await fetch('/account', {
            method: 'DELETE',
            headers: { Authorization: localStorage.getItem('token') },
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Deletion failed');

        M.toast({ html: 'Account deleted successfully!' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Deletion error:', error);
        M.toast({ html: error.message, classes: 'red' });
    }
});

fetchAccountDetails();
