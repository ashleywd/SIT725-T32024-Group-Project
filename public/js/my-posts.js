let allPosts = []; // Store all posts for reference
let currentEditPostId = null;

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    // Initialize Materialize components
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);

    // Initialize floating action button
    const elems = document.querySelectorAll('.fixed-action-btn');
    M.FloatingActionButton.init(elems);

    // Get the posts after initialization
    await getMyPosts();
});

const getStatusClass = (status) => {
    const statusClasses = {
        'open': 'green-text',
        'active': 'blue-text',
        'completed': 'grey-text',
        'cancelled': 'red-text'
    };
    return statusClasses[status] || '';
};

const renderPostCard = (post, type = 'created') => {
    const offersSection = type === 'created' && post.offers && post.offers.length > 0 ? `
        <div class="offers-section">
            ${post.status === 'active' ? 
                `<p><strong>Offer Accepted</strong></p>` :
                `<p><strong>Offers:</strong></p>
                ${post.offers.map(offer => `
                    <div class="offer-card">
                        <p class="offer-message">${offer.message}</p>
                        <p class="offer-status ${getStatusClass(offer.status)}">
                            Status: ${offer.status === 'accepted' ? 'Accepted' : 
                                    offer.status === 'rejected' ? 'Rejected' : 
                                    offer.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                        </p>
                        ${offer.status === 'pending' ? `
                            <div class="offer-actions">
                                <button class="btn waves-effect waves-light green"
                                        onclick="handleOffer('${post._id}', '${offer._id}', 'accept')">
                                    Accept
                                </button>
                                <button class="btn waves-effect waves-light red"
                                        onclick="handleOffer('${post._id}', '${offer._id}', 'reject')">
                                    Reject
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            `}
        </div>
    ` : '';

    const responseMessage = post.responseMessage ? `
        <div class="message-section">
            <p><strong>Response Message:</strong></p>
            <p class="message">${post.responseMessage}</p>
        </div>
    ` : '';

    let actionButtons = '';
    if (type === 'created') {
        if (post.status === 'open') {
            actionButtons = `
                <button class="btn waves-effect waves-light blue"
                        onclick="editPost('${post._id}')">
                    <i class="material-icons left">edit</i>
                    Edit
                </button>
                <button class="btn waves-effect waves-light red"
                        onclick="cancelPost('${post._id}')">
                    <i class="material-icons left">cancel</i>
                    Cancel Post
                </button>
            `;
        } else if (post.status === 'active') {
            actionButtons = `
                <button class="btn waves-effect waves-light green"
                        onclick="markCompleted('${post._id}')">
                    <i class="material-icons left">check_circle</i>
                    Mark Completed
                </button>
            `;
        }
    } else if (type === 'pending') {
        actionButtons = `
            <button class="btn waves-effect waves-light red"
                    onclick="cancelOffer('${post._id}')">
                <i class="material-icons left">cancel</i>
                Cancel Offer
            </button>
        `;
    } else if (type === 'accepted' && post.status === 'active') {
        actionButtons = `
            <button class="btn waves-effect waves-light red"
                    onclick="cancelAcceptance('${post._id}')">
                <i class="material-icons left">cancel</i>
                Cancel Acceptance
            </button>
        `;
    }

    return `
        <div class="col s12 m6 l4">
            <div class="card">
                <div class="card-content">
                    <span class="card-title">
                        <i class="material-icons left">
                            ${post.type === 'offer' ? 'person_outline' : 'child_care'}
                        </i>
                        ${post.type === 'offer' ? 'Babysitting Offer' : 'Babysitter Request'}
                    </span>
                    <p><strong>Date:</strong> ${new Date(post.dateTime).toLocaleString()}</p>
                    <p><strong>Hours:</strong> ${post.hoursNeeded}</p>
                    <p><strong>Status:</strong> <span class="${getStatusClass(post.status)}">
                        ${post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span></p>
                    <p class="description">${post.description}</p>
                    ${responseMessage}
                    ${offersSection}
                </div>
                <div class="card-action">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
};

const renderMyPosts = (posts) => {
    const currentUserId = localStorage.getItem('userId');
    
    const myCreatedPosts = posts.filter(post => 
        post.userId._id === currentUserId || post.userId === currentUserId
    );
    const myAcceptedPosts = posts.filter(post => 
        post.acceptedBy?._id === currentUserId || post.acceptedBy === currentUserId
    );
    const myPendingOffers = posts.filter(post => 
        post.offers?.some(offer => 
            (offer.userId._id === currentUserId || offer.userId === currentUserId) && 
            offer.status === 'pending'
        )
    );

    const createdPostsEl = document.getElementById('myCreatedPosts');
    if (createdPostsEl) {
        createdPostsEl.innerHTML = myCreatedPosts.length ? 
            myCreatedPosts.map(post => renderPostCard(post, 'created')).join('') :
            '<div class="col s12"><p>No posts created yet.</p></div>';
    }

    const acceptedPostsEl = document.getElementById('myAcceptedPosts');
    if (acceptedPostsEl) {
        acceptedPostsEl.innerHTML = myAcceptedPosts.length ?
            myAcceptedPosts.map(post => renderPostCard(post, 'accepted')).join('') :
            '<div class="col s12"><p>No posts accepted yet.</p></div>';
    }

    const pendingOffersEl = document.getElementById('myPendingOffers');
    if (pendingOffersEl) {
        pendingOffersEl.innerHTML = myPendingOffers.length ?
            myPendingOffers.map(post => renderPostCard(post, 'pending')).join('') :
            '<div class="col s12"><p>No pending offers.</p></div>';
    }
};

const editPost = async (postId) => {
    const post = allPosts.find(p => p._id === postId);
    if (!post) return;

    currentEditPostId = postId;

    // Fill form with current values
    document.getElementById('editType').value = post.type;
    document.getElementById('editHoursNeeded').value = post.hoursNeeded;
    document.getElementById('editDescription').value = post.description;
    document.getElementById('editDateTime').value = new Date(post.dateTime).toISOString().slice(0, 16);

    // Update Materialize form
    M.FormSelect.init(document.getElementById('editType'));
    M.updateTextFields();
    M.textareaAutoResize(document.getElementById('editDescription'));

    const modal = M.Modal.getInstance(document.getElementById('editPostModal'));
    modal.open();
};

const cancelPost = async (postId) => {
    if (!confirm('Are you sure you want to cancel this post?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel post');
        }
        
        M.toast({html: 'Post cancelled successfully'});
        getMyPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
};

const handleOffer = async (postId, offerId, action) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}/handle-offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ offerId, action })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to handle offer');
        }

        M.toast({html: `Offer has been ${action === 'accept' ? 'accepted' : 'rejected'}`});
        getMyPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
};

const cancelOffer = async (postId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}/cancel-offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel offer');
        }
        
        M.toast({html: 'Offer cancelled successfully'});
        getMyPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
};

const cancelAcceptance = async (postId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}/cancel-acceptance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel acceptance');
        }
        
        M.toast({html: 'Acceptance cancelled successfully'});
        getMyPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
};

const markCompleted = async (postId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to mark as completed');
        
        M.toast({html: 'Post marked as completed!'});
        getMyPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
};

const getMyPosts = async () => {
    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('errorContainer').style.display = 'none';

        const token = localStorage.getItem("token");
        const response = await fetch("/api/posts/my-posts", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                window.location.href = '/login';
                return;
            }
            throw new Error('Failed to fetch posts');
        }

        const posts = await response.json();
        allPosts = posts; // Store posts globally
        renderMyPosts(posts);
        
        document.getElementById('loadingIndicator').style.display = 'none';
    } catch (error) {
        console.error("Failed to fetch posts", error);
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Failed to load posts. Please try again.';
        M.toast({html: 'Failed to load posts', classes: 'red'});
    }
};

// Event listener for edit form submission
document.getElementById('editPostForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        type: document.getElementById('editType').value,
        hoursNeeded: parseFloat(document.getElementById('editHoursNeeded').value),
        description: document.getElementById('editDescription').value,
        dateTime: document.getElementById('editDateTime').value,
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${currentEditPostId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to edit post');
        }
        
        M.toast({html: 'Post updated successfully'});
        const modal = M.Modal.getInstance(document.getElementById('editPostModal'));
        modal.close();
        getMyPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
});