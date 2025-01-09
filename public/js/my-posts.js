async function getMyPosts() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
 
    const response = await fetch("/api/posts/my-posts", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
 
    if (!response.ok && response.status === 401) {
      clearTokenAndRedirectToLogin();
      throw new Error("Failed to fetch posts");
    }
 
    const posts = await response.json();
    renderPosts(posts);
    initializeButtons();
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
 }
 
 const completedButton = ({ postId, postedBy }) => `
  <div class="center-align">
    
      id="completed-button"
      class="btn-flat blue-text"
      data-post-info="${encodeURIComponent(JSON.stringify({ postId, postedBy }))}"
    >
      Mark as Completed
    </a>
  </div>
 `;
 
 const createMyPost = ({
  _id,
  type,
  hoursNeeded,
  dateTime,
  description,
  status,
  postedBy,
 }) => `
  <div id="post-${_id}" class="col s6">
    <div class="card">
      <div class="card-content">
        <span class="card-title">
          <i class="material-icons left">
            ${type === "offer" ? "person_outline" : "child_care"}
          </i>
          ${type === "offer" ? "Babysitting Offer" : "Babysitter Request"}
        </span>
        <p><strong>Hours:</strong> ${hoursNeeded}</p>
        <p><strong>Date:</strong> ${new Date(dateTime).toLocaleString()}</p>
        <p>${description}</p>
        <p>
          <strong>Status:</strong> ${String(status).toUpperCase()}
        </p>
        ${status === "accepted" ? completedButton({ postId: _id, postedBy }) : ""}
      </div>
      ${status === "open" ? `
      <div class="card-action">
        <a href="#" class="edit-post blue-text" data-post-id="${_id}">
          <i class="material-icons left">edit</i>Edit
        </a>
        <a href="#" class="delete-post red-text" data-post-id="${_id}">
          <i class="material-icons left">delete</i>Delete
        </a>
      </div>
      ` : ''}
    </div>
  </div>
 `;
 
 const handleMarkCompleted = async (postInfo) => {
  const userToken = localStorage.getItem("token");
  try {
    const decodedData = decodeURIComponent(postInfo);
    const { postId, postedBy } = JSON.parse(decodedData);
    
    const response = await fetch("/api/posts/status/" + postId, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify({ postId, postedBy, status: "completed" }),
    });
 
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Server error: ${result.error || "Unknown error"}`);
    }
 
    M.toast({ html: 'Post marked as completed', classes: 'green' });
    getMyPosts();
  } catch (error) {
    console.error('Error marking post as completed:', error);
    M.toast({ html: 'Failed to mark post as completed', classes: 'red' });
  }
 };
 
 const handleEditPost = async (postId) => {
  try {
    const token = localStorage.getItem("token");
    const dateTime = document.getElementById('editDateTime').value;
    const hoursNeeded = parseInt(document.getElementById('editHoursNeeded').value);
 
    const requestBody = {
      type: document.getElementById('editType').value,
      hoursNeeded: hoursNeeded,
      dateTime: new Date(dateTime).toISOString(),
      description: document.getElementById('editDescription').value
    };
 
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(requestBody)
    });
 
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update post');
    }
 
    M.toast({ html: 'Post updated successfully', classes: 'green' });
    getMyPosts();
  } catch (error) {
    console.error('Error updating post:', error);
    M.toast({ html: error.message || 'Failed to update post', classes: 'red' });
  }
 };
 
 const handleDeletePost = async (postId) => {
  try {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
 
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token
      }
    });
 
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete post');
    }
 
    M.toast({ html: 'Post deleted successfully', classes: 'green' });
    getMyPosts();
  } catch (error) {
    console.error('Error deleting post:', error);
    M.toast({ html: error.message || 'Failed to delete post', classes: 'red' });
  }
 };
 
 const renderPosts = (posts) => {
  const postsHtml =
    Array.isArray(posts) && posts.length > 0
      ? posts.map((post) => createMyPost(post)).join("")
      : "<p>You have no posts yet.</p>";
  document.getElementById("postsContent").innerHTML = postsHtml;
 };
 
 const initializeButtons = () => {
  // Completed buttons
  const completedButtons = document.querySelectorAll("#completed-button");
  if (completedButtons.length > 0) {
    completedButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (e.target.matches("a")) {
          const postInfo = e.target.dataset.postInfo;
          handleMarkCompleted(postInfo);
        }
      });
    });
  }
 
  // Edit buttons
  document.querySelectorAll('.edit-post').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.closest('.edit-post');
      if (!target) return;
      const postId = target.dataset.postId;
      const postElement = document.getElementById(`post-${postId}`);
      
      // Get current values
      const type = postElement.querySelector('.card-title').textContent.includes('Offer') ? 'offer' : 'request';
      const hoursNeeded = postElement.querySelector('p:nth-child(2)').textContent.replace('Hours:', '').trim();
      const dateTime = new Date(postElement.querySelector('p:nth-child(3)').textContent.replace('Date:', '').trim())
        .toISOString().slice(0, 16);
      const description = postElement.querySelector('p:nth-child(4)').textContent;
 
      // Set values in modal
      document.getElementById('editType').value = type;
      document.getElementById('editHoursNeeded').value = hoursNeeded;
      document.getElementById('editDateTime').value = dateTime;
      document.getElementById('editDescription').value = description;
 
      // Initialize and open modal
      const modal = M.Modal.init(document.getElementById('editPostModal'));
      modal.open();
 
      // Set up save button
      document.getElementById('saveEditButton').onclick = () => {
        handleEditPost(postId);
        modal.close();
      };
 
      // Reinitialize Materialize select
      M.FormSelect.init(document.getElementById('editType'));
      M.updateTextFields();
    });
  });
 
  // Delete buttons
  document.querySelectorAll('.delete-post').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.closest('.delete-post');
      if (!target) return;
      const postId = target.dataset.postId;
      handleDeletePost(postId);
    });
  });
 };
 
 document.addEventListener('DOMContentLoaded', () => {
  // Initialize Materialize components
  M.Modal.init(document.querySelectorAll('.modal'));
  M.FormSelect.init(document.querySelectorAll('select'));
  
  // Start the application
  verifyUserAuthentication();
  activateWebSocket();
  getMyPosts();
 });