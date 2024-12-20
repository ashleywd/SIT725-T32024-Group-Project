checkAuth();

// Initialize Materialize components
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll("select");
    var instances = M.FormSelect.init(elems);

    // Initialize modals
    var modals = document.querySelectorAll(".modal");
    M.Modal.init(modals);

    // Add filter change listeners
    document.getElementById('filterType').addEventListener('change', filterPosts);
    document.getElementById('filterStatus').addEventListener('change', filterPosts);
    document.getElementById('sortBy').addEventListener('change', filterPosts);

    // Initial load of posts
    getPosts();
});

// Track current post interaction
let currentPostId = null;
let currentAction = null;
let allPosts = []; // Store all posts for filtering

const getStatusClass = (status) => {
    const statusClasses = {
        'open': 'green-text',
        'active': 'blue-text',
        'completed': 'grey-text',
        'cancelled': 'red-text'
    };
    return statusClasses[status] || '';
};

const getPosts = async () => {
    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('errorContainer').style.display = 'none';
        document.getElementById('postsContent').style.display = 'none';

        const token = localStorage.getItem("token");

        const response = await fetch("/api/posts", {
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
        
        allPosts = await response.json();
        filterPosts();
        
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('postsContent').style.display = 'block';
    } catch (error) {
        console.error("Failed to fetch posts", error);
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Failed to load posts. Please try again.';
        M.toast({html: 'Failed to load posts', classes: 'red'});
    }
};

const filterPosts = () => {
    if (!Array.isArray(allPosts)) {
        console.error('Posts data is not an array:', allPosts);
        return;
    }

    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;
    const currentUserId = localStorage.getItem('userId');
    
    // Get only open posts from other users
    let filteredPosts = allPosts.filter(post => {
        const postUserId = post.userId._id || post.userId;
        return postUserId !== currentUserId && post.status === 'open';
    });
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.type === typeFilter);
    }

    // Sort posts
    const sortPosts = (posts) => {
        return posts.sort((a, b) => {
            switch(sortBy) {
                case 'newest':
                    return new Date(b.dateTime) - new Date(a.dateTime);
                case 'oldest':
                    return new Date(a.dateTime) - new Date(b.dateTime);
                case 'hours-asc':
                    return a.hoursNeeded - b.hoursNeeded;
                case 'hours-desc':
                    return b.hoursNeeded - a.hoursNeeded;
                default:
                    return 0;
            }
        });
    };

    const sortedPosts = filteredPosts.length > 0 ? sortPosts(filteredPosts) : [];
    
    renderPosts(sortedPosts);
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

      M.toast({html: `Offer has been ${action}ed`});
      getPosts(); // Refresh the posts
  } catch (error) {
      M.toast({html: error.message, classes: 'red'});
  }
};

const renderPosts = (posts = []) => {
    const postsContainer = document.getElementById('postsContent');
    if (!postsContainer) {
        console.error('Posts container not found');
        return;
    }
  
    const html = `
        <div class="col s12">
            <h4 class="header">
                <i class="material-icons left">public</i>
                Available Posts
            </h4>
            <div class="row">
                ${Array.isArray(posts) && posts.length > 0 ? 
                    posts.map(post => renderPostCard(post, 'other')).join('') :
                    '<div class="col s12"><p>No available posts match your filters.</p></div>'
                }
            </div>
        </div>
    `;
  
    postsContainer.innerHTML = html;
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

      // Actions for other users' posts
      const userOffer = post.offers?.find(offer => 
          offer.userId._id === currentUserId || offer.userId === currentUserId
      );

      if (userOffer) {
          if (userOffer.status === 'pending') {
              return `
                  <button class="btn waves-effect waves-light red"
                          onclick="cancelOffer('${post._id}')">
                      <i class="material-icons left">cancel</i>Cancel Offer
                  </button>
              `;
          }
          return `
              <span class="status-badge ${getStatusClass(userOffer.status)}">
                  ${userOffer.status.charAt(0).toUpperCase() + userOffer.status.slice(1)}
              </span>
          `;
      }

      return post.status === 'open' ? `
          <button class="btn waves-effect waves-light green"
                  onclick="handlePostAction('${post._id}', '${post.type}')">
              <i class="material-icons left">send</i>
              ${post.type === 'offer' ? 'Accept Offer' : 'Offer Help'}
          </button>
      ` : '';
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

const markCompleted = async (postId) => {
  try {
      if (!confirm('Are you sure you want to mark this post as completed?')) {
          return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/complete`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          }
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to complete post');
      }
      
      M.toast({html: 'Post marked as completed!'});
      getPosts();
  } catch (error) {
      console.error("Error completing post:", error);
      M.toast({html: error.message, classes: 'red'});
  }
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
      getPosts();
  } catch (error) {
      console.error('Error cancelling post:', error);
      M.toast({html: error.message, classes: 'red'});
  }
};

const editPost = async (postId) => {
  // Find the post in our allPosts array
  const post = allPosts.find(p => p._id === postId);
  if (!post) {
      M.toast({html: 'Post not found', classes: 'red'});
      return;
  }

  // Fill the edit form with current values
  document.getElementById('type').value = post.type;
  document.getElementById('hoursNeeded').value = post.hoursNeeded;
  document.getElementById('description').value = post.description;
  
  // Format the date for datetime-local input
  const postDate = new Date(post.dateTime);
  const formattedDate = postDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  document.getElementById('dateTime').value = formattedDate;

  // Update Materialize form elements
  M.FormSelect.init(document.getElementById('type'));
  M.updateTextFields();
  M.textareaAutoResize(document.getElementById('description'));

  // Store the post ID for the form submission
  document.getElementById('postForm').dataset.editPostId = postId;

  // Update modal title and submit button text
  const modalTitle = document.querySelector('#modalForm h4');
  if (modalTitle) modalTitle.textContent = 'Edit Babysitting Post';

  // Open the modal
  const modal = M.Modal.getInstance(document.getElementById('modalForm'));
  modal.open();
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
      getPosts();
  } catch (error) {
      M.toast({html: error.message, classes: 'red'});
  }
};

const handlePostAction = async (postId, type) => {
    currentPostId = postId;
    currentAction = type;
    
    const modalTitle = document.getElementById('responseModalTitle');
    modalTitle.textContent = type === 'offer' ? 
        'Accept this babysitting offer' : 
        'Offer to help with babysitting';
    
    document.getElementById('responseMessage').value = '';
    M.updateTextFields();
    
    const modal = M.Modal.getInstance(document.getElementById('responseModal'));
    modal.open();
};

const cancelOffer = async (postId) => {
    if (!confirm('Are you sure you want to cancel your offer?')) return;

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
        getPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
};

const postForm = document.getElementById("postForm");
postForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  
  const formData = {
      type: document.getElementById("type").value,
      hoursNeeded: parseFloat(document.getElementById("hoursNeeded").value),
      description: document.getElementById("description").value,
      dateTime: document.getElementById("dateTime").value,
  };

  const editPostId = this.dataset.editPostId;
  const isEdit = Boolean(editPostId);

  try {
      const token = localStorage.getItem("token");
      const response = await fetch(isEdit ? `/api/posts/${editPostId}` : "/api/posts", {
          method: isEdit ? "PUT" : "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
          throw new Error(`Server error: ${result.error || result.message || "Unknown error"}`);
      }

      const modal = M.Modal.getInstance(document.getElementById("modalForm"));
      modal.close();

      M.toast({ 
          html: isEdit ? 
              'Post updated successfully!' : 
              `${formData.type === 'offer' ? 'Babysitting offer' : 'Babysitter request'} posted successfully!` 
      });

      // Reset form and clear edit state
      postForm.reset();
      delete this.dataset.editPostId;
      
      // Reset form elements
      var elems = document.querySelectorAll("select");
      M.FormSelect.init(elems);
      
      // Refresh posts list
      getPosts();
  } catch (error) {
      console.error("Detailed error:", error);
      M.toast({
          html: `Error: ${error.message}`,
          classes: "red",
      });
  }
});

document.getElementById('sendResponseButton').addEventListener('click', async () => {
    const message = document.getElementById('responseMessage').value.trim();
    
    if (!message) {
        M.toast({html: 'Please add a message', classes: 'red'});
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const endpoint = currentAction === 'offer' ? 'accept' : 'offer-help';
        const response = await fetch(`/api/posts/${currentPostId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to process action');
        }
        
        const successMessage = currentAction === 'offer' ? 
            'Offer has been accepted successfully!' : 
            'Help offer has been sent successfully!';
            
        M.toast({html: successMessage});
        const modal = M.Modal.getInstance(document.getElementById('responseModal'));
        modal.close();
        document.getElementById('responseMessage').value = '';
        M.updateTextFields();
        
        getPosts();
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
});