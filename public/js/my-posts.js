import {
  verifyUserAuthentication,
  clearTokenAndRedirectToLogin,
  getStatusColor,
  initializeMaterializeComponent,
  updatePointsDisplay,
  getPostById,
  getStatusActions,
} from "./global.js";

import { activateWebSocket } from "./socket-client.js";

import {
  displayNotifications,
  handleStatusNotification,
  createNotification,
} from "./notifications.js";

import { pointsService } from "./points.js";

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
    const originalPost = await getPostById(postId);
    const dateTime = new Date(originalPost.dateTime).toLocaleString();

    // 1. Update post status first
    const response = await fetch(`/api/posts/status/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify({ postId, postedBy, status: "completed" }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${result.error || "Unknown error"}`);
    }

    // 2. Get status actions
    const actions = getStatusActions(
      {
        ...originalPost,
        status: "completed",
      },
      dateTime
    );

    // 3. Create notification for post creator
    await createNotification(
      originalPost.postedBy, // Send to creator
      actions.creatorMessage,
      userToken,
      window.location.origin
    );

    // 4. Create notification for acceptor
    if (originalPost.acceptedBy) {
      await createNotification(
        originalPost.acceptedBy, // Send to acceptor
        actions.acceptorMessage,
        userToken,
        window.location.origin
      );
    }

    // 5. Update points if needed
    if (actions.pointsUpdate) {
      await pointsService.updatePoints(
        actions.pointsUpdate.amount,
        actions.pointsUpdate.reason,
        false, // Suppress separate points notification
        actions.pointsUpdate.recipient
      );
    }

    // 6. Update UI
    // M.toast({ html: "Post marked as completed", classes: "green" });
    displayMyPosts();
    updatePointsDisplay();
    displayNotifications();
  } catch (error) {
    console.error("Error marking post as completed:", error);
    M.toast({ html: "Failed to mark post as completed", classes: "red" });
  }
};

const handleEditPost = async (postId) => {
  try {
    const userToken = localStorage.getItem("token");
    const currentUserId = JSON.parse(atob(userToken.split(".")[1])).userId;
    const dateTimeInput = document.getElementById("editDateTime").value;
    const selectedDate = new Date(dateTimeInput);
    const originalPost = await getPostById(postId);
    const newHours = parseInt(document.getElementById("editHoursNeeded").value);
    const isRequestPost =
      document.getElementById("editType").value === "request";
    const wasRequestPost = originalPost.type === "request";

    /// Only calculate point difference if both old and new posts are requests
    const pointDifference =
      isRequestPost && wasRequestPost ? newHours - originalPost.hoursNeeded : 0;

    // Points validation for requests only
    if (isRequestPost && wasRequestPost && pointDifference > 0) {
      const currentPoints = await pointsService.getPoints();
      if (currentPoints < pointDifference) {
        throw new Error("Insufficient points for increasing hours");
      }
    }

    // Validate date
    if (selectedDate < new Date()) {
      throw new Error("Cannot set date/time in the past");
    }

    // Update the post
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

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to update post");
    }

    // Create notification about post update with specific userId
    await createNotification(
      currentUserId, // Use currentUserId instead of null
      `You have updated your ${result.type} post for ${new Date(
        result.dateTime
      ).toLocaleString()}.${
        pointDifference !== 0
          ? ` ${Math.abs(pointDifference)} points have been ${
              pointDifference > 0 ? "deducted" : "refunded"
            }.`
          : ""
      }`,
      userToken,
      window.location.origin
    );

    // Handle points updates only if both old and new posts are requests
    if (isRequestPost && wasRequestPost) {
      if (pointDifference > 0) {
        await pointsService.updatePoints(
          -pointDifference,
          "updating your babysitting request",
          false
        );
      } else if (pointDifference < 0) {
        await pointsService.updatePoints(
          Math.abs(pointDifference),
          "reducing hours in your babysitting request",
          false
        );
      }
    }

    // 5. Update UI
    const modal = M.Modal.getInstance(document.getElementById("editPostModal"));
    modal.close();
    M.toast({
      html: `Post updated successfully${
        pointDifference !== 0
          ? ` and points have been ${
              pointDifference > 0 ? "deducted" : "refunded"
            }`
          : ""
      }`,
      classes: "green",
    });
    displayMyPosts();
    updatePointsDisplay();
    displayNotifications();
  } catch (error) {
    console.error("Error updating post:", error);
    M.toast({ html: error.message || "Failed to update post", classes: "red" });
  }
};

const handleCancelPost = async (postId) => {
  try {
    if (!confirm("Are you sure you want to cancel this post?")) {
      return;
    }

    const originalPost = await getPostById(postId);
    const dateTime = new Date(originalPost.dateTime).toLocaleString();
    const userToken = localStorage.getItem("token");
    const currentUserId = JSON.parse(atob(userToken.split(".")[1])).userId;

    // Update post status
    const response = await fetch(`/api/posts/cancel/${postId}`, {
      method: "PUT",
      headers: {
        Authorization: userToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel post");
    }

    // Get status actions for notifications and points
    const actions = getStatusActions(
      {
        ...originalPost,
        status: "cancelled",
      },
      dateTime
    );

    // Create notification for post creator
    await createNotification(
      currentUserId,
      actions.creatorMessage,
      userToken,
      window.location.origin
    );

    // Create notification for acceptor if post was accepted
    if (originalPost.acceptedBy && actions.acceptorMessage) {
      await createNotification(
        originalPost.acceptedBy, // Send to acceptor
        actions.acceptorMessage, // Use acceptor-specific message
        userToken,
        window.location.origin
      );
    }

    // Update points based on post type
    if (actions.pointsUpdate) {
      await pointsService.updatePoints(
        actions.pointsUpdate.amount,
        actions.pointsUpdate.reason,
        false // Suppress separate points notification
      );
    }

    // Update UI
    displayMyPosts();
    updatePointsDisplay();
    displayNotifications();
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

    document.getElementById("editType").value = postData.type;
    document.getElementById("editHoursNeeded").value = postData.hoursNeeded;
    document.getElementById("editDateTime").value = selectedDate;
    document.getElementById("editDescription").value = postData.description;

    // Initialize and open modal
    const modelElement = document.getElementById("editPostModal");
    const modalInstance = M.Modal.init(modelElement);
    modalInstance.open();

    // Set up save button
    const saveButton = document.getElementById("saveEditButton");
    saveButton.dataset.postId = postId;
    saveButton.addEventListener("click", handleSaveEdits);

    // Reinitialize Materialize components
    M.updateTextFields();
  } catch (error) {
    console.error("Error parsing date:", error);
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
  handleStatusNotification(data.updatedPost);
  displayMyPosts();
  displayNotifications();
};

const handlePostsUpdated = () => {
  displayNotifications();
};

initializeMaterializeComponent();
displayMyPosts();
displayNotifications();
updatePointsDisplay();
activateWebSocket({ handleNotifyAcceptPost, handlePostsUpdated });

export { displayMyPosts };
