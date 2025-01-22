import {
  verifyUserAuthentication,
  clearTokenAndRedirectToLogin,
  getStatusColor,
  initializeMaterializeComponent,
  updatePointsDisplay,
  getPostById,
} from "./services/global.js";

import { activateWebSocket } from "./services/socket-client.js";

import {
  displayNotifications,
  createPostNotification,
} from "./services/notifications.js";

import { pointsService } from "./services/points.js";

verifyUserAuthentication();

const getMyPosts = async () => {
  try {
    const userToken = localStorage.getItem("token");
    if (!userToken) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/posts/my-posts", {
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
    });

    if (!response.ok && response.status === 401) {
      clearTokenAndRedirectToLogin();
      throw new Error("Failed to fetch posts");
    }

    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
};

const renderPosts = (posts) => {
  const postsHtml =
    Array.isArray(posts) && posts.length > 0
      ? posts.map((post) => createMyPost(post)).join("")
      : "<p>You have no posts yet.</p>";

  const postsContainer = document.getElementById("postsContent");
  postsContainer.innerHTML = postsHtml;
};

const displayMyPosts = async () => {
  const posts = await getMyPosts();
  renderPosts(posts);
  initializeButtons();
};

const completedButton = ({ postId, postedBy }) => `
  <a href="#"
    id="completed-button"
    class="waves-effect waves-light btn green"
    data-post-id="${postId}"
    data-post-posted-by="${postedBy._id}"
  >
    <i class="material-icons left">check</i>Complete
  </a>
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
  <div id="post-${_id}" class="col s12 m6">
    <div class="card hoverable">
      <div class="card-content">
        <span class="card-title grey-text text-darken-4">
          <i class="material-icons left">
            ${type === "offer" ? "person_outline" : "child_care"}
          </i>
          ${type === "offer" ? "Babysitting Offer" : "Babysitter Request"}
          <span class="right">
            <span class="new badge ${getStatusColor(
              status
            )}" data-badge-caption="">${String(status).toUpperCase()}</span>
          </span>
        </span>
        <div class="divider"></div>
        <div class="section">
          <p><i class="material-icons tiny">schedule</i> <strong>Hours:</strong> ${hoursNeeded}</p>
          <p><i class="material-icons tiny">event</i> <strong>Date:</strong> ${new Date(
            dateTime
          ).toLocaleString()}</p>
          <p><i class="material-icons tiny">description</i> ${description}</p>
        </div>
      </div>
      ${getCardActions(_id, status, postedBy)}
    </div>
  </div>
 `;

const cancelButton = (id) => `
  <a href="#" class="cancel-post waves-effect waves-light btn red" data-post-id="${id}">
    <i class="material-icons left">cancel</i>Cancel
  </a>
`;

const editButton = (id) => `
  <a href="#" class="edit-post waves-effect waves-light btn blue" data-post-id="${id}"">
    <i class="material-icons left">edit</i>Edit
  </a>
`;

const getCardActions = (id, status, postedBy) => {
  if (status === "completed" || status === "cancelled") return "";

  return `
    <div class="card-action">
      <div class="row">
          ${
            status === "accepted"
              ? completedButton({ postId: id, postedBy })
              : editButton(id)
          }
          ${cancelButton(id)}
      </div>
    </div>
  `;
};

const handleMarkCompleted = async (postId, postedBy) => {
  const userToken = localStorage.getItem("token");
  try {
    // 1. Get original post details
    const post = await getPostById(postId);
    const currentUserId = JSON.parse(atob(userToken.split(".")[1])).userId;

    // 2. Update post status
    const response = await fetch(`/api/posts/status/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify({ postId, postedBy, status: "completed" }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to complete post");
    }

    // 3. Update points based on post type
    if (post.type === "offer") {
      // Credit points to offer creator
      await pointsService.updatePoints(post.hoursNeeded, post.postedBy);
    } else if (post.type === "request") {
      // Credit points to request acceptor
      await pointsService.updatePoints(post.hoursNeeded, post.acceptedBy);
    }

    // 4. Create notifications for post creator
    await createPostNotification(
      {
        ...post,
        status: "completed",
        dateTime: post.dateTime,
        type: post.type,
        hoursNeeded: post.hoursNeeded,
        postedBy: post.postedBy,
        acceptedBy: post.acceptedBy,
      },
      post.postedBy,
      userToken,
      { toast: true, persistent: true }
    );

    // 5. Create notifications for post acceptor
    await createPostNotification(
      {
        ...post,
        status: "completed",
        dateTime: post.dateTime,
        type: post.type,
        hoursNeeded: post.hoursNeeded,
        postedBy: post.postedBy,
        acceptedBy: post.acceptedBy,
      },
      post.acceptedBy,
      userToken,
      { toast: false, persistent: true }
    );

    // 6. Update UI
    displayMyPosts();
    displayNotifications();
    updatePointsDisplay();
  } catch (error) {
    console.error("Error completing post:", error);
    M.toast({
      html: error.message || "Failed to complete post",
      classes: "red",
    });
  }
};

const handleEditPost = async (postId) => {
  try {
    const userToken = localStorage.getItem("token");
    const currentUserId = JSON.parse(atob(userToken.split(".")[1])).userId;
    const originalPost = await getPostById(postId);
    const newHours = parseFloat(
      document.getElementById("editHoursNeeded").value
    );
    const isRequestPost =
      document.getElementById("editType").value === "request";

    // 1. Calculate and validate points for request posts
    if (isRequestPost && originalPost.type === "request") {
      const pointDifference = newHours - originalPost.hoursNeeded;
      if (pointDifference > 0) {
        const currentPoints = await pointsService.getPoints();
        if (currentPoints < pointDifference) {
          throw new Error("Insufficient points for increasing hours");
        }
      }
    }

    // 2. Validate form data
    const dateTimeInput = document.getElementById("editDateTime").value;
    const selectedDate = new Date(dateTimeInput);
    if (selectedDate < new Date()) {
      throw new Error("Cannot set date/time in the past");
    }
    const newType = document.getElementById("editType").value;
    if (newType !== originalPost.type) {
      throw new Error("Cannot change post type between offer and request");
    }

    // 3. Update post
    const response = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify({
        type: document.getElementById("editType").value,
        hoursNeeded: newHours,
        dateTime: selectedDate.toISOString(),
        description: document.getElementById("editDescription").value,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update post");
    }

    const updatedPost = await response.json();

    // 4. Handle points adjustment for requests
    if (isRequestPost && originalPost.type === "request") {
      const pointDifference = newHours - originalPost.hoursNeeded;
      if (pointDifference !== 0) {
        await pointsService.updatePoints(
          -pointDifference, // Negative if more hours (deduct points), positive if fewer hours (refund points)
          currentUserId
        );
      }
    }

    // 5. Create notification for post creator
    await createPostNotification(
      {
        ...updatedPost,
        status: "edited",
        dateTime: selectedDate,
        type: document.getElementById("editType").value,
        hoursNeeded: newHours,
        postedBy: currentUserId,
        pointDifference: isRequestPost
          ? newHours - originalPost.hoursNeeded
          : 0,
      },
      currentUserId,
      userToken,
      { toast: true, persistent: true }
    );

    // 6. Update UI
    const modal = M.Modal.getInstance(document.getElementById("editPostModal"));
    modal.close();
    displayMyPosts();
    displayNotifications();
    updatePointsDisplay();
  } catch (error) {
    console.error("Error updating post:", error);
    M.toast({ html: error.message || "Failed to update post", classes: "red" });
  }
};

const handleCancelPost = async (postId) => {
  try {
    // 1. Confirm cancellation
    if (!confirm("Are you sure you want to cancel this post?")) {
      return;
    }

    const userToken = localStorage.getItem("token");
    const currentUserId = JSON.parse(atob(userToken.split(".")[1])).userId;

    // 2. Get original post details before cancellation
    const originalPost = await getPostById(postId);

    // 3. Update post status to cancelled
    const response = await fetch(`/api/posts/cancel/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    if (!response.ok) {
      throw new Error("Failed to cancel post");
    }

    // 4. Handle points refunds
    if (originalPost.type === "request") {
      // Refund points to request creator
      await pointsService.updatePoints(originalPost.hoursNeeded, currentUserId);
    } else if (originalPost.type === "offer" && originalPost.acceptedBy) {
      // Refund points to offer acceptor
      await pointsService.updatePoints(
        originalPost.hoursNeeded,
        originalPost.acceptedBy
      );
    }

    // 5. Create notifications
    // Notification for post creator (always)
    await createPostNotification(
      {
        ...originalPost,
        status: "cancelled",
        dateTime: originalPost.dateTime,
        type: originalPost.type,
        hoursNeeded: originalPost.hoursNeeded,
        postedBy: currentUserId,
      },
      currentUserId,
      userToken,
      { toast: true, persistent: true }
    );

    // 6. Notification for post acceptor (if exists)
    if (originalPost.acceptedBy) {
      await createPostNotification(
        {
          ...originalPost,
          status: "cancelled",
          dateTime: originalPost.dateTime,
          type: originalPost.type,
          hoursNeeded: originalPost.hoursNeeded,
          postedBy: currentUserId,
          acceptedBy: originalPost.acceptedBy,
        },
        originalPost.acceptedBy,
        userToken,
        { toast: false, persistent: true }
      );
    }

    // 7. Update UI
    displayMyPosts();
    displayNotifications();
    updatePointsDisplay();
  } catch (error) {
    console.error("Error cancelling post:", error);
    M.toast({ html: error.message || "Failed to cancel post", classes: "red" });
  }
};

const handleClickCompletePost = (e) => {
  e.preventDefault();
  const postId = e.currentTarget.dataset.postId;
  const postedBy = e.currentTarget.dataset.postPostedBy;
  handleMarkCompleted(postId, postedBy);
};

const handleSaveEdits = (e) => {
  e.preventDefault();
  const postId = e.target.dataset.postId;
  handleEditPost(postId);
};

const getLocalDate = (date) => {
  const localDate = new Date(date)
    .toLocaleString("sv", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(" ", "T");

  return localDate;
};

const handleClickEditPost = async (e) => {
  e.preventDefault();
  const target = e.target.closest(".edit-post");
  if (!target) return;

  try {
    const postId = target.dataset.postId;
    const postData = await getPostById(postId);
    const selectedDate = getLocalDate(postData.dateTime);

    // Populate form fields
    document.getElementById("editType").value = postData.type;
    document.getElementById("editHoursNeeded").value = postData.hoursNeeded;
    document.getElementById("editDateTime").value = selectedDate;
    document.getElementById("editDescription").value = postData.description;

    // Initialize and open modal
    const modalElement = document.getElementById("editPostModal");
    const modalInstance = M.Modal.init(modalElement);

    // Set up save button once
    const saveButton = document.getElementById("saveEditButton");
    saveButton.dataset.postId = postId;
    saveButton.onclick = (e) => {
      e.preventDefault();
      handleEditPost(postId);
    };

    modalInstance.open();
    M.FormSelect.init(document.getElementById("editType"));
    M.updateTextFields();
  } catch (error) {
    console.error("Error opening edit form:", error);
    M.toast({ html: "Error opening edit form", classes: "red" });
  }
};

const handleClickCancelPost = (e) => {
  e.preventDefault();
  const target = e.target.closest(".cancel-post");
  if (!target) return;
  const postId = target.dataset.postId;
  handleCancelPost(postId);
};

const initializeButtons = () => {
  const completedButtons = document.querySelectorAll("#completed-button");
  completedButtons.forEach((btn) => {
    btn.addEventListener("click", handleClickCompletePost);
  });

  const editButtons = document.querySelectorAll(".edit-post");
  editButtons.forEach((button) => {
    button.addEventListener("click", handleClickEditPost);
  });

  const cancelButtons = document.querySelectorAll(".cancel-post");
  cancelButtons.forEach((button) => {
    button.addEventListener("click", handleClickCancelPost);
  });
};

const handleNotifyAcceptPost = (data) => {
  // Add a small delay to ensure notification is created first
  setTimeout(() => {
    displayMyPosts();
    displayNotifications();
    updatePointsDisplay();
  }, 500); // 500ms delay
};

const handlePostsUpdated = () => {
  // Add a small delay to ensure notification is created first
  setTimeout(() => {
    displayNotifications();
    updatePointsDisplay();
  }, 500); // 500ms delay
};

initializeMaterializeComponent();
displayMyPosts();
displayNotifications();
updatePointsDisplay();
activateWebSocket({ handleNotifyAcceptPost, handlePostsUpdated });

export { displayMyPosts };
