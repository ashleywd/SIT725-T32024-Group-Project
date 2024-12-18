checkAuth();

// Initialize any Materialize components
document.addEventListener('DOMContentLoaded', function() {
    var modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
});

const renderMyPosts = (posts) => {
    const postsContainer = document.getElementById('myPostsContainer');
    
    postsContainer.innerHTML = posts.map(post => {
        // Handle offers section
        const offersSection = post.offers && post.offers.length > 0 ? `
            <div class="offers-section">
                <p><strong>Offers:</strong></p>
                ${post.offers.map(offer => `
                    <div class="offer-card">
                        <p class="offer-message">${offer.message}</p>
                        <p class="offer-status">Status: ${offer.status}</p>
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
        ` : '';

        // Handle response message display
        const responseMessage = post.responseMessage ? `
            <div class="message-section">
                <p><strong>Response Message:</strong></p>
                <p class="message">${post.responseMessage}</p>
            </div>
        ` : '';

        return `
            <div class="col s12 m6 l4">
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">
                            <i class="material-icons left">
                                ${post.type === 'offer' ? 'person_outline' : 'child_care'}
                            </i>
                            ${post.type === 'offer' ? 'Babysitting Offer' : 'Babysitter Needed'}
                        </span>
                        <p><strong>Date:</strong> ${new Date(post.dateTime).toLocaleString()}</p>
                        <p><strong>Hours:</strong> ${post.hoursNeeded}</p>
                        <p><strong>Status:</strong> ${post.status}</p>
                        <p class="description">${post.description}</p>
                        ${responseMessage}
                        ${offersSection}
                    </div>
                    <div class="card-action">
                        ${post.status === 'accepted' ? `
                            <button class="btn waves-effect waves-light green"
                                    onclick="markCompleted('${post._id}')">
                                Mark Completed
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

const handleOffer = async (postId, offerId, action) => {
    try {
        const response = await fetch(`/api/posts/${postId}/handle-offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ offerId, action })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to handle offer');
        }

        M.toast({html: `Offer ${action}ed successfully!`});
        getMyPosts(); // Refresh the posts
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
};

const markCompleted = async (postId) => {
    try {
        const response = await fetch(`/api/posts/${postId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
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
        const response = await fetch("/api/posts/my-posts", {
            headers: {
                "Authorization": localStorage.getItem("token"),
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        const posts = await response.json();
        renderMyPosts(posts);
    } catch (error) {
        console.error("Failed to fetch posts", error);
        M.toast({html: 'Failed to load posts', classes: 'red'});
    }
};

// Initial load of posts
getMyPosts();