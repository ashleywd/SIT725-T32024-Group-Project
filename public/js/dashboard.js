import {
  verifyUserAuthentication,
  clearTokenAndRedirectToLogin,
  getStatusColor,
  initializeMaterializeComponent,
  resetScreenPosition,
  updatePointsDisplay,
} from "./global.js";

import { activateWebSocket } from "./socket-client.js";

import {
  displayNotifications,
  handleStatusNotification,
  createNotification,
} from "./notifications.js";

import { pointsService } from "./points.js";

const postForm = document.getElementById("postForm");

const handleSubmitForm = async function (e) {
  e.preventDefault();
  const formData = {
    type: document.getElementById("type").value,
    hoursNeeded: parseFloat(document.getElementById("hoursNeeded").value),
    description: document.getElementById("description").value,
    dateTime: document.getElementById("dateTime").value,
  };

  try {
    const userToken = localStorage.getItem("token");

    // Points validation first
    if (formData.type === "request") {
      const currentPoints = await pointsService.getPoints();
      if (currentPoints < formData.hoursNeeded) {
        throw new Error("Insufficient points for this request");
      }
    }

    // Create post
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Unknown error");
    }

    // Handle points update for requests
    if (formData.type === "request") {
      await pointsService.updatePoints(
        -formData.hoursNeeded,
        "babysitting request",
        false // Don't create notification yet
      );
    }

    // Create single consolidated notification
    await createNotification(
      null,
      `You have created a new ${formData.type} post for ${new Date(
        formData.dateTime
      ).toLocaleString()}.${
        formData.type === "request"
          ? ` ${formData.hoursNeeded} points have been deducted.`
          : ""
      }`,
      userToken,
      window.location.origin
    );

    await displayNotifications();

    // UI Updates
    const modal = M.Modal.getInstance(document.getElementById("modalForm"));
    modal.close();
    M.toast({ html: "Post created successfully!" });
    postForm.reset();
    updatePointsDisplay();
    displayPosts();
    displayNotifications();
  } catch (error) {
    console.error("Error creating post:", error);
    M.toast({ html: error.message, classes: "red" });
  }
};

postForm.addEventListener("submit", handleSubmitForm);

const getPosts = async () => {
  const postsContent = document.getElementById("postsContent");

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    postsContent.innerHTML = "";

    const response = await fetch("/api/posts", {
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

const filterPosts = (posts, typeFilter, statusFilter) => {
  return posts.filter((post) => {
    const matchesType = typeFilter === "all" || post.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    return matchesType && matchesStatus;
  });
};

const filterAndRenderPosts = async () => {
  try {
    const posts = await getPosts();
    const typeFilter = document.getElementById("typeFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;
    const filteredPosts = filterPosts(posts, typeFilter, statusFilter);
    renderPosts(filteredPosts);
    initializeButtons();
  } catch (error) {
    console.error("Error filtering posts:", error);
    M.toast({ html: "Failed to filter posts", classes: "red" });
  }
};

// Initialize both filter selects
const initializeFilterSelects = () => {
  const filterSelects = document.querySelectorAll("#typeFilter, #statusFilter");
  filterSelects.forEach((select) => {
    select.addEventListener("change", filterAndRenderPosts);
  });
};

initializeFilterSelects();

const acceptButtonComponent = ({ status, postId, postedBy }) => {
  if (status !== "open") return "";

  return `
    <div class="center-align">
      <button
        id="accept-post-button"
        class="waves-effect waves-light btn blue"
        data-post-info="${encodeURIComponent(
          JSON.stringify({ postId, postedBy })
        )}"
      >
        <i class="material-icons left">handshake</i>Accept
      </button>
    </div>
  `;
};

const createPost = ({
  postId,
  postedBy,
  type,
  dateTime,
  description,
  hoursNeeded,
  status,
}) => `
  <div class="col s12 m6">
    <div class="card hoverable post-card">
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
          <p><i class="material-icons tiny">person</i> <strong>Posted by:</strong> ${
            postedBy?.username
          }</p>
          <p><i class="material-icons tiny">schedule</i> <strong>Hours:</strong> ${hoursNeeded}</p>
          <p><i class="material-icons tiny">event</i> <strong>Date:</strong> ${new Date(
            dateTime
          ).toLocaleString()}</p>
          <p><i class="material-icons tiny">description</i> ${description}</p>
        </div>
      </div>
      ${
        status === "open"
          ? `
        <div class="card-action">
          <div class="row">
            ${acceptButtonComponent({ status, postId, postedBy })}
          </div>
        </div>
      `
          : ""
      }
    </div>
  </div>
`;

const handleAcceptPost = async (postInfo) => {
  const userToken = localStorage.getItem("token");
  try {
    const decodedData = decodeURIComponent(postInfo);
    const { postId, postedBy } = JSON.parse(decodedData);

    // Get post and validate points first
    const post = await getPostById(postId);
    if (post.type === "offer") {
      const currentPoints = await pointsService.getPoints();
      if (currentPoints < post.hoursNeeded) {
        throw new Error("Insufficient points to accept this offer");
      }
    }

    // Update post status
    const response = await fetch(`/api/posts/status/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify({ postId, postedBy, status: "accepted" }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to accept post");
    }

    // Create acceptance notification
    await createNotification(
      null,
      `You have accepted ${post.type === "offer" ? "a" : "to provide"} 
      babysitting ${post.type === "offer" ? "offer" : ""} 
      for ${new Date(post.dateTime).toLocaleString()}.${
        post.type === "offer"
          ? ` ${post.hoursNeeded} points will be deducted from your account.`
          : ""
      }`,
      userToken,
      window.location.origin
    );

    // Update points if offer (only after successful post update)
    if (post.type === "offer") {
      await pointsService.updatePoints(
        -post.hoursNeeded,
        "accepting a babysitting offer",
        false // Suppress points notification
      );
    }

    // Show success message
    M.toast({ html: "Post accepted successfully", classes: "green" });
  } catch (error) {
    console.error("Error accepting post:", error);
    M.toast({ html: error.message || "Failed to accept post", classes: "red" });
  }
};

const initializeButtons = () => {
  const acceptPostButtons = document.querySelectorAll("#accept-post-button");

  if (acceptPostButtons.length > 0) {
    acceptPostButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (e.target.matches("button")) {
          const postInfo = e.target.dataset.postInfo;
          handleAcceptPost(postInfo);
        }
      });
    });
  }
};

const renderPosts = (posts) => {
  const postsHtml =
    Array.isArray(posts) && posts.length > 0
      ? posts
          .map((post) =>
            createPost({
              postId: post._id,
              postedBy: post.postedBy,
              type: post.type,
              dateTime: post.dateTime,
              description: post.description,
              hoursNeeded: post.hoursNeeded,
              status: post.status,
            })
          )
          .join("")
      : "<p>No posts available.</p>";

  const postContentContainer = document.getElementById("postsContent");
  postContentContainer.innerHTML = postsHtml;
};

const displayPosts = async () => {
  const posts = await getPosts();
  renderPosts(posts);
  initializeButtons();
};

const handleNotifyAcceptPost = (data) => {
  handleStatusNotification(data.updatedPost);
  displayPosts();
  displayNotifications();
  updatePointsDisplay();
  resetScreenPosition();
};

const handlePostsUpdated = () => {
  filterAndRenderPosts();
  displayNotifications();
  updatePointsDisplay();
  resetScreenPosition();
};

verifyUserAuthentication();
initializeMaterializeComponent();
displayPosts();
displayNotifications();
updatePointsDisplay();
activateWebSocket({ handleNotifyAcceptPost, handlePostsUpdated });

export { displayPosts };
