checkAuth();

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

const renderMyPosts = (posts) => {
    const currentUserId = localStorage.getItem('userId');

    // Sort posts into categories
    const createdPosts = posts.filter(post => {
        const postUserId = post.userId._id || post.userId;
        return postUserId === currentUserId;
    });

    const acceptedPosts = posts.filter(post => {
        const acceptedById = post.acceptedBy?._id || post.acceptedBy;
        return acceptedById === currentUserId;
    });

    const pendingOffers = posts.filter(post => {
        return post.offers?.some(offer => 
            (offer.userId._id === currentUserId || offer.userId === currentUserId) && 
            offer.status === 'pending'
        );
    });

    // Render each section
    document.getElementById('myCreatedPosts').innerHTML = createdPosts.length > 0 
        ? createdPosts.map(post => renderPostCard(post, 'created')).join('')
        : '<div class="col s12"><p>No posts created yet.</p></div>';

    document.getElementById('myAcceptedPosts').innerHTML = acceptedPosts.length > 0
        ? acceptedPosts.map(post => renderPostCard(post, 'accepted')).join('')
        : '<div class="col s12"><p>No posts accepted yet.</p></div>';

    document.getElementById('myPendingOffers').innerHTML = pendingOffers.length > 0
        ? pendingOffers.map(post => renderPostCard(post, 'pending')).join('')
        : '<div class="col s12"><p>No pending offers.</p></div>';
};

const renderPostCard = (post, type) => {
    const currentUserId = localStorage.getItem('userId');
    const isOwnPost = (post.userId._id === currentUserId) || (post.userId === currentUserId);

    const renderOffers = () => {
        if (!isOwnPost || !post.offers || post.offers.length === 0) return '';

        return `
            <div class="offers-section">
                <p><strong>Offers (${post.offers.length}):</strong></p>
                ${post.offers.map(offer => `
                    <div class="offer-card">
                        <p><strong>${offer.userId.username}</strong></p>
                        <p class="offer-message">${offer.message}</p>
                        <p class="offer-status ${getStatusClass(offer.status)}">
                            Status: ${offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
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
            </div>
        `;
    };

    const renderActions = () => {
        if (isOwnPost) {
            if (post.status === 'open') {
                return `
                    <button class="btn waves-effect waves-light blue"
                            onclick="editPost('${post._id}')">
                        <i class="material-icons left">edit</i>Edit
                    </button>
                    <button class="btn waves-effect waves-light red"
                            onclick="cancelPost('${post._id}')">
                        <i class="material-icons left">cancel</i>Cancel
                    </button>
                `;
            } else if (post.status === 'active') {
                return `
                    <button class="btn waves-effect waves-light green"
                            onclick="markCompleted('${post._id}')">
                        <i class="material-icons left">check_circle</i>Mark Completed
                    </button>
                `;
            }
            return '';
        }
    
        // For posts in the "Posts I've Accepted" section
        if (type === 'accepted') {
            return `
                <button class="btn waves-effect waves-light red"
                        onclick="cancelAcceptance('${post._id}')">
                    <i class="material-icons left">remove_circle</i>Cancel Acceptance
                </button>
            `;
        }
    
        const userOffer = post.offers?.find(offer => 
            offer.userId._id === currentUserId || offer.userId === currentUserId
        );
    
        if (userOffer) {
            return `
                <button class="btn waves-effect waves-light red"
                        onclick="cancelOffer('${post._id}')">
                    <i class="material-icons left">remove_circle</i>Cancel Offer
                </button>
            `;
        }
    
        return '';
    };

    return `
        <div class="col s12 m6 l4">
            <div class="card">
                <div class="card-content">
                    <span class="card-title">
                        <i class="material-icons left">
                            ${post.type === 'offer' ? 'person_outline' : 'child_care'}
                        </i>
                        ${post.type === 'offer' ? 'Babysitting Offer' : 'Babysitter Request'}
                        ${post.status !== 'open' ? `
                            <span class="badge ${getStatusClass(post.status)}">
                                ${post.status.toUpperCase()}
                            </span>
                        ` : ''}
                    </span>
                    <p><strong>Posted by:</strong> ${post.userId.username}</p>
                    <p><strong>Date:</strong> ${new Date(post.dateTime).toLocaleString()}</p>
                    <p><strong>Hours:</strong> ${post.hoursNeeded}</p>
                    <p class="description">${post.description}</p>
                    ${post.acceptedBy ? `
                        <p><strong>Accepted By:</strong> ${post.acceptedBy.username}</p>
                    ` : ''}
                    ${renderOffers()}
                </div>
                <div class="card-action">
                    ${renderActions()}
                </div>
            </div>
        </div>
    `;
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
        
        getMyPosts();
        M.toast({html: `Offer ${action}ed successfully`});
    } catch (error) {
        console.error('Error handling offer:', error);
        M.toast({html: error.message, classes: 'red'});
    }
};

// const getPosts = async () => {
//     try {
//         document.getElementById('loadingIndicator').style.display = 'block';
//         document.getElementById('errorContainer').style.display = 'none';
//         document.getElementById('postsContent').style.display = 'none';

//         const token = localStorage.getItem("token");
//         const currentUserId = localStorage.getItem("userId");

//         const response = await fetch("/api/posts", {
//             headers: {
//                 "Authorization": `Bearer ${token}`,
//                 "Content-Type": "application/json"
//             }
//         });
        
//         if (!response.ok) {
//             if (response.status === 401) {
//                 localStorage.removeItem('token');
//                 localStorage.removeItem('userId');
//                 window.location.href = '/login';
//                 return;
//             }
//             throw new Error('Failed to fetch posts');
//         }
        
//         const allPosts = await response.json();
        
//         // Filter for user's own posts
//         const myPosts = allPosts.filter(post => {
//             const postUserId = post.userId._id || post.userId;
//             return postUserId === currentUserId;
//         });

//         // Render posts
//         const postsContainer = document.getElementById('postsContent');
//         if (myPosts.length > 0) {
//             const html = myPosts.map(post => renderPostCard(post)).join('');
//             postsContainer.innerHTML = html;
//         } else {
//             postsContainer.innerHTML = '<p>You have no posts yet.</p>';
//         }
        
//         document.getElementById('loadingIndicator').style.display = 'none';
//         document.getElementById('postsContent').style.display = 'block';
//     } catch (error) {
//         console.error("Failed to fetch posts", error);
//         document.getElementById('loadingIndicator').style.display = 'none';
//         document.getElementById('errorContainer').style.display = 'block';
//         document.getElementById('errorMessage').textContent = 'Failed to load posts. Please try again.';
//         M.toast({html: 'Failed to load posts', classes: 'red'});
//     }
// };

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
        
        // Store posts globally
        allPosts = posts;
        
        // Render posts
        renderMyPosts(posts);
        
        document.getElementById('loadingIndicator').style.display = 'none';
    } catch (error) {
        console.error("Failed to fetch posts:", error);
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