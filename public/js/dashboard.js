checkAuth();

// Initialize Materialize components
var elems = document.querySelectorAll("select");
var instances = M.FormSelect.init(elems);

// Initialize modals
var modals = document.querySelectorAll(".modal");
M.Modal.init(modals);

// Track current post interaction
let currentPostId = null;
let currentAction = null;
let allPosts = []; // Store all posts for filtering

// Form submission handler
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
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Server error: ${result.error || "Unknown error"}`);
    }

    console.log("Server response:", result);

    // Close the modal after successful submission
    const modal = M.Modal.getInstance(document.getElementById("modalForm"));
    modal.close();

    M.toast({ html: "Post created successfully!" });
    postForm.reset();

    // Reinitialize select after form reset
    M.FormSelect.init(elems);
    
    // Refresh posts display
    getPosts();
  } catch (error) {
    console.error("Detailed error:", error);
    M.toast({
      html: `Error: ${error.message}`,
      classes: "red",
    });
  }
});

// Filter change handlers
document.getElementById('filterType').addEventListener('change', filterPosts);
document.getElementById('filterStatus').addEventListener('change', filterPosts);
document.getElementById('sortBy').addEventListener('change', filterPosts);

const filterPosts = () => {
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filteredPosts = [...allPosts];
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.type === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.status === statusFilter);
    }
    
    // Apply sorting
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
    const isOwnPost = post.userId.toString() === currentUserId.toString();
    const actionButton = isOwnPost ? '' : `
      <button class="btn waves-effect waves-light ${post.type === 'offer' ? 'green' : 'blue'}"
              onclick="handlePostAction('${post._id}', '${post.type}')" 
              ${post.status !== 'open' ? 'disabled' : ''}>
        ${post.type === 'offer' ? 'Accept Offer' : 'Offer Help'}
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
              ${post.type === 'offer' ? 'Babysitting Offer' : 'Babysitter Needed'}
            </span>
            <p><strong>Date:</strong> ${new Date(post.dateTime).toLocaleString()}</p>
            <p><strong>Hours:</strong> ${post.hoursNeeded}</p>
            <p><strong>Status:</strong> ${post.status}</p>
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

const handlePostAction = async (postId, type) => {
    currentPostId = postId;
    currentAction = type;
    
    const modalTitle = document.getElementById('responseModalTitle');
    modalTitle.textContent = type === 'offer' ? 
        'Accept this babysitting offer' : 
        'Offer to help with babysitting';
    
    // Clear previous message
    document.getElementById('responseMessage').value = '';
    M.updateTextFields(); // Reset labels
    
    const modal = M.Modal.getInstance(document.getElementById('responseModal'));
    modal.open();
};

// Handle sending the response
document.getElementById('sendResponseButton').addEventListener('click', async () => {
    const message = document.getElementById('responseMessage').value.trim();
    
    if (!message) {
        M.toast({html: 'Please add a message', classes: 'red'});
        return;
    }

    try {
        const endpoint = currentAction === 'offer' ? 'offer-help' : 'accept';
        const response = await fetch(`/api/posts/${currentPostId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to process action');
        }
        
        M.toast({html: `Successfully ${currentAction === 'offer' ? 'offered help' : 'accepted offer'}!`});
        const modal = M.Modal.getInstance(document.getElementById('responseModal'));
        modal.close();
        document.getElementById('responseMessage').value = '';
        M.updateTextFields();
        
        getPosts(); // Refresh the posts
    } catch (error) {
        M.toast({html: error.message, classes: 'red'});
    }
});

const getPosts = async () => {
    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('errorContainer').style.display = 'none';
        document.getElementById('postsContent').style.display = 'none';

        const response = await fetch("/api/posts", {
            headers: {
                "Authorization": localStorage.getItem("token"),
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        
        allPosts = await response.json(); // Store posts globally
        filterPosts(); // Apply current filters
        
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

// Initial load of posts
document.addEventListener('DOMContentLoaded', () => {
    getPosts();
});