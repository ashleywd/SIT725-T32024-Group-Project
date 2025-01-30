import {
  verifyUserAuthentication,
  clearTokenAndRedirectToLogin,
  getStatusColor,
  initializeMaterializeComponent,
  resetScreenPosition,
} from "./global.js";
import { activateWebSocket } from "./socket-client.js";
import { displayNotifications } from "./notifications.js";
import { updatePointsDisplay } from "./points.js";
import pointsService from "./services/points.js";
import accountService from "./services/account.js";

const postForm = document.getElementById("postForm");

const createPost = async function () {
  const formData = {
    type: document.getElementById("type").value,
    hoursNeeded: Number(document.getElementById("hoursNeeded").value),
    description: document.getElementById("description").value,
    dateTime: document.getElementById("dateTime").value,
  };

  try {
    // We need to deduct points before creating the post
    if (formData.type === "request") {
      const { userId: recipientId, points } = await accountService.getAccountDetails();
      const newPoints = points - formData.hoursNeeded;
      await pointsService.updatePoints(newPoints, recipientId);
    }

    // TODO: Move to services
    const userToken = localStorage.getItem("token");
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

    const modal = M.Modal.getInstance(document.getElementById("modalForm"));
    modal.close();
    postForm.reset();
    M.toast({ html: "Post created successfully!" });

    displayPosts();
    updatePointsDisplay();
  } catch (error) {
    console.error("Error creating post:", error);
    M.toast({ html: error.message, classes: "red" });
  }
};

const validatePoints = async () => {
  try {
    const hoursNeeded = parseFloat(document.getElementById("hoursNeeded").value);
    const currentPoints = await pointsService.getPoints();
    if (currentPoints < hoursNeeded) {
      throw new Error("Insufficient points for this request");
    }
  } catch (error) {
    console.error("Error validating has enough points:", error);
    M.toast({ html: error.message, classes: "red" });
  }
};

const validatePostCreation = async (e) => {
  try {
    e.preventDefault();
    const currentDate = new Date();
    const dateField = document.getElementById("dateTime").value;
    const selectedDate = new Date(dateField);
    if (selectedDate < currentDate) {
      throw new Error("Cannot set date/time in the past");
    }

    const type = document.getElementById("type").value;
    if (type === "request") {
      await validatePoints();
    }

    createPost();
  } catch (error) {
    console.error("Error validating post creation:", error);
    M.toast({ html: error.message, classes: "red" });
  }
};

postForm.addEventListener("submit", validatePostCreation);

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
          JSON.stringify({ postId, postedBy }),
        )}"
      >
        <i class="material-icons left">handshake</i>Accept
      </button>
    </div>
  `;
};

const createPostElement = ({
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
              status,
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
            dateTime,
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

    await response.json();
    M.toast({ html: "Post accepted successfully", classes: "green" });
    displayPosts();
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
            createPostElement({
              postId: post._id,
              postedBy: post.postedBy,
              type: post.type,
              dateTime: post.dateTime,
              description: post.description,
              hoursNeeded: post.hoursNeeded,
              status: post.status,
            }),
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
  const operation = data.updatedPost.status;
  M.toast({
    html: `Post ${data.updatedPost.description} ${operation}.`,
    classes: "green",
  });
  displayPosts();
  resetScreenPosition();
  displayNotifications();
};

const handlePostsUpdated = () => {
  resetScreenPosition();
  filterAndRenderPosts();
  displayNotifications();
};

verifyUserAuthentication();
initializeMaterializeComponent();
displayPosts();
displayNotifications();
updatePointsDisplay();
activateWebSocket({ handleNotifyAcceptPost, handlePostsUpdated });

export { displayPosts };
