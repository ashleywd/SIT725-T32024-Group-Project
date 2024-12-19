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
        console.log("Token present:", !!token);

        const response = await fetch("/api/posts", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log("Unauthorized - redirecting to login");
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
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filteredPosts = [...allPosts];
    
    if (typeFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.type === typeFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.status === statusFilter);
    }
    
    filteredPosts.sort((a, b) => {
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
    
    renderPosts(filteredPosts);
};

const renderPosts = (posts) => {
  const postsContainer = document.getElementById('postsContent');
  const currentUserId = localStorage.getItem('userId');
  
  if (posts.length === 0) {
      postsContainer.innerHTML = `
          <div class="col s12">
              <div class="card-panel">
                  <span>No posts found matching your filters.</span>
              </div>
          </div>
      `;
      return;
  }
  
  postsContainer.innerHTML = posts.map(post => {
    const isOwnPost = post.userId._id === currentUserId || post.userId === currentUserId;
    const isMyOffer = post.offers?.some(offer => {
        const isMyOfferId = offer.userId === currentUserId || offer.userId._id === currentUserId;
        return isMyOfferId && offer.status === 'pending';
    });

    let buttonText, buttonClass, isDisabled = false;
    let buttonAction = isMyOffer ? 'cancelOffer' : 'handlePostAction';

    if (post.status === 'active') {
        if (post.acceptedBy?._id === currentUserId || post.acceptedBy === currentUserId) {
            buttonText = 'Cancel Acceptance';
            buttonClass = 'red';
            buttonAction = 'cancelAcceptance';
            isDisabled = false;
        } else {
            buttonText = post.type === 'offer' ? 'Offer Accepted' : 'Offer Sent';
            buttonClass = 'grey';
            isDisabled = true;
        }
    } else if (isMyOffer) {
        buttonText = 'Cancel Offer';
        buttonClass = 'red';
        buttonAction = 'cancelOffer';
    } else {
        buttonText = post.type === 'offer' ? 'Accept Offer' : 'Offer Help';
        buttonClass = post.type === 'offer' ? 'green' : 'blue';
        isDisabled = post.status !== 'open';
    }

    const actionButton = isOwnPost ? '' : `
        <button class="btn waves-effect waves-light ${buttonClass}"
                onclick="${buttonAction}('${post._id}', '${post.type}')" 
                ${isDisabled ? 'disabled' : ''}>
            ${buttonText}
        </button>
    `;

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
                      ${post.responseMessage ? `
                          <div class="message-section">
                              <p><strong>Response Message:</strong></p>
                              <p class="message">${post.responseMessage}</p>
                          </div>
                      ` : ''}
                  </div>
                  <div class="card-action">
                      ${actionButton}
                  </div>
              </div>
          </div>
      `;
  }).join('');
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

    try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(formData),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Server error: ${result.error || "Unknown error"}`);
        }

        const modal = M.Modal.getInstance(document.getElementById("modalForm"));
        modal.close();

        M.toast({ html: `${formData.type === 'offer' ? 'Babysitting offer' : 'Babysitter request'} posted successfully!` });
        postForm.reset();
        
        var elems = document.querySelectorAll("select");
        M.FormSelect.init(elems);
        
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