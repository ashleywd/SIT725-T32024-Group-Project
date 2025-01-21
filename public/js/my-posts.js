import {
  verifyUserAuthentication,
  clearTokenAndRedirectToLogin,
  getStatusColor,
  initializeMaterializeComponent,
  updatePointsDisplay,
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

const getStatusActions = (post, dateTime) => {
  const statusKey = `${post.status}_${post.type}`;

  switch (statusKey) {
    case "completed_offer":
      return {
        creatorMessage: `Your babysitting offer for ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`,
        acceptorMessage: `The babysitting offer you accepted for ${dateTime} has been completed.`,
        pointsUpdate: {
          amount: post.hoursNeeded,
          recipient: post.postedBy,
          reason: "completing your babysitting offer",
        },
      };

    case "completed_request":
      return {
        creatorMessage: `Your babysitting request for ${dateTime} has been completed.`,
        acceptorMessage: `The babysitting session you provided on ${dateTime} has been completed and ${post.hoursNeeded} points have been credited to your account.`,
        pointsUpdate: {
          amount: post.hoursNeeded,
          recipient: post.acceptedBy,
          reason: "completing the babysitting session",
        },
      };

    case "cancelled_offer":
      return {
        creatorMessage: `You have cancelled your offer post for ${dateTime}.`,
        acceptorMessage: post.acceptedBy
          ? `The babysitting offer you accepted for ${dateTime} has been cancelled. ${post.hoursNeeded} points have been refunded.`
          : null,
        pointsUpdate: post.acceptedBy
          ? {
              amount: post.hoursNeeded,
              recipient: post.acceptedBy,
              reason: "cancelled babysitting offer refund",
            }
          : null,
      };

    case "cancelled_request":
      return {
        creatorMessage: `You have cancelled your request post for ${dateTime}. ${post.hoursNeeded} points have been refunded.`,
        acceptorMessage: post.acceptedBy
          ? `The babysitting request you accepted for ${dateTime} has been cancelled.`
          : null,
        pointsUpdate: {
          amount: post.hoursNeeded,
          recipient: post.postedBy,
          reason: "cancelling your babysitting request",
        },
      };

    default:
      return null;
  }
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
    const actions = getStatusActions(originalPost, dateTime);

    // 3. Create notifications
    await createNotification(
      null,
      actions.creatorMessage,
      userToken,
      window.location.origin
    );

    if (originalPost.acceptedBy) {
      await createNotification(
        originalPost.acceptedBy,
        actions.acceptorMessage,
        userToken,
        window.location.origin
      );
    }

    // 4. Update points
    if (actions.pointsUpdate) {
      await pointsService.updatePoints(
        actions.pointsUpdate.amount,
        actions.pointsUpdate.reason,
        false
      );
    }

    // 5. Update UI
    M.toast({ html: "Post marked as completed", classes: "green" });
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
    const token = localStorage.getItem("token");
    const dateTimeInput = document.getElementById("editDateTime").value;
    const selectedDate = new Date(dateTimeInput);
    const originalPost = await getPostById(postId);
    const newHours = parseInt(document.getElementById("editHoursNeeded").value);
    const pointDifference = newHours - originalPost.hoursNeeded;

    // Points validation for requests first
    if (document.getElementById("editType").value === "request") {
      if (pointDifference > 0) {
        const currentPoints = await pointsService.getPoints();
        if (currentPoints < pointDifference) {
          throw new Error("Insufficient points for increasing hours");
        }
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
        Authorization: token,
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

    // Create notification about post update
    await createNotification(
      null,
      `You have updated your ${result.type} post for ${new Date(
        result.dateTime
      ).toLocaleString()}.${
        pointDifference !== 0
          ? ` ${Math.abs(pointDifference)} points have been ${
              pointDifference > 0 ? "deducted" : "refunded"
            }.`
          : ""
      }`,
      token,
      window.location.origin
    );

    // Handle points updates after post update succeeds
    if (document.getElementById("editType").value === "request") {
      if (pointDifference > 0) {
        // Deduct points for increased hours
        await pointsService.updatePoints(
          -pointDifference,
          "updating your babysitting request",
          false
        );
      } else if (pointDifference < 0) {
        // Refund points for reduced hours
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
    // 1. Confirmation validation
    if (!confirm("Are you sure you want to cancel this post?")) {
      return;
    }

    const originalPost = await getPostById(postId);
    const dateTime = new Date(originalPost.dateTime).toLocaleString();
    const token = localStorage.getItem("token");

    // 2. Update post status first
    const response = await fetch(`/api/posts/cancel/${postId}`, {
      method: "PUT",
      headers: {
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel post");
    }

    // 3. Get status actions
    const actions = getStatusActions(
      {
        ...originalPost,
        status: "cancelled",
      },
      dateTime
    );

    // 4. Create notifications
    await createNotification(
      null,
      actions.creatorMessage,
      token,
      window.location.origin
    );

    if (originalPost.acceptedBy && actions.acceptorMessage) {
      await createNotification(
        originalPost.acceptedBy,
        actions.acceptorMessage,
        token,
        window.location.origin
      );
    }

    // 5. Update points if needed
    if (actions.pointsUpdate) {
      await pointsService.updatePoints(
        actions.pointsUpdate.amount,
        actions.pointsUpdate.reason,
        false
      );
    }

    // 6. Update UI
    M.toast({
      html: "Post cancelled successfully",
      classes: "green",
    });

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

const getPostById = async (postId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/posts/${postId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        method: "GET",
      },
    });
    const post = await response.json();
    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    M.toast({ html: "Failed to fetch post", classes: "red" });
  }
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
