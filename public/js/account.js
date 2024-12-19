checkAuth();

document.addEventListener('DOMContentLoaded', function() {   
    var elems = document.querySelectorAll("select");
    var instances = M.FormSelect.init(elems);

    var modals = document.querySelectorAll(".modal");
    M.Modal.init(modals);  

});

const fetchAccountDetails = async () => {
    try {
        const token = localStorage.getItem('token');        
        const response = await fetch('/api/account', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch account details');
        }

        const data = await response.json();
        document.getElementById('accountName').innerText = data.name || 'N/A';
        document.getElementById('accountEmail').innerText = data.email || 'N/A';
        document.getElementById('accountPoints').innerText = data.points || 0;
    } catch (err) {
        console.error('Error fetching account details:', err.message);
        var instance = M.Modal.getInstance(document.getElementById("errorModal"));
        instance.open();
    }
};

const fetchUserPoints = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/account/points', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user points');
        }

        const data = await response.json();
        document.getElementById('pointsBadge').innerText = data.points || 0;
    } catch (err) {
        console.error('Error fetching user points:', err.message);
    }
};

document.getElementById('editAccountBtn').addEventListener('click', () => {  
    const accountName = document.getElementById('accountName').innerText;
    const accountEmail = document.getElementById('accountEmail').innerText;    

    document.getElementById('editName').value = accountName;
    document.getElementById('editEmail').value = accountEmail;

    document.getElementById('accountDetails').style.display = 'none';
    document.getElementById('editAccountBtn').style.display = 'none';
    document.getElementById('deleteAccountBtn').style.display = 'none'; // Hide the delete button
    document.getElementById('updateForm').style.display = 'block';
});

document.getElementById('updateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = JSON.stringify(Object.fromEntries(formData));

    try {
        const response = await fetch('/api/account', {
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

        document.getElementById('accountDetails').style.display = 'block';
        document.getElementById('editAccountBtn').style.display = 'block';
        document.getElementById('deleteAccountBtn').style.display = 'block'; // Show the delete button
        document.getElementById('updateForm').style.display = 'none';
    } catch (error) {
        console.error('Update error:', error);
        M.toast({ html: error.message, classes: 'red' });
    }
});

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your account?')) return;

    try {
        const response = await fetch('/api/account', {
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

// Fetch account details on page load
fetchAccountDetails();