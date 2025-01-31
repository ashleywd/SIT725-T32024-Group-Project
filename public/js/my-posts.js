import {
  verifyUserAuthentication,
  getStatusColor,
  initializeMaterializeComponent,
} from "./global.js";
import { activateWebSocket } from "./socket-client.js";
import { displayNotifications } from "./notifications.js";
import postsService from "./services/posts.js";
import { updatePointsDisplay } from "./points.js";
import myPostsService from "./services/myPosts.js";
import pointsService from "./services/points.js";
import accountService from "./services/account.js";

verifyUserAuthentication();

const renderPosts = (posts) => {
  const postsHtml =
    Array.isArray(posts) && posts.length > 0
      ? posts.map((post) => createMyPost(post)).join("")
      : "<p>You have no posts yet.</p>";

  const postsContainer = document.getElementById("postsContent");
  postsContainer.innerHTML = postsHtml;
};

const displayMyPosts = async () => {
  try {
    const posts = await myPostsService.getMyPosts();
    renderPosts(posts);
    initializeButtons();
  } catch (error) {
    console.error("Failed to display posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
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
              status,
            )}" data-badge-caption="">${String(status).toUpperCase()}</span>
          </span>
        </span>
        <div class="divider"></div>
        <div class="section">
          <p><i class="material-icons tiny">schedule</i> <strong>Hours:</strong> ${hoursNeeded}</p>
          <p><i class="material-icons tiny">event</i> <strong>Date:</strong> ${new Date(
            dateTime,
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
          ${status === "accepted" ? completedButton({ postId: id, postedBy }) : editButton(id)}
          ${cancelButton(id)}
      </div>
    </div>
  `;
};

const handleMarkCompleted = async (postId, postedBy) => {
  try {
    // Credit points
    const post = await postsService.getPostById(postId);
    const recipientId = post.type === "offer" ? post.postedBy : post.acceptedBy;
    const recipient = await accountService.getAccountDetailsByUserId(recipientId);
    const newPoints = Number(recipient.points) + Number(post.hoursNeeded);
    await pointsService.updatePoints(newPoints, recipientId);

    // Update post status
    const status = "completed";
    await postsService.updatePostStatus(postId, postedBy, status);

    M.toast({ html: "Post marked as completed", classes: "green" });

    displayMyPosts();
    updatePointsDisplay();
  } catch (error) {
    console.error("Error marking post as completed:", error);
    M.toast({ html: "Failed to mark post as completed", classes: "red" });
  }
};

const handleEditPost = async (postId) => {
  try {
    const dateTimeInput = document.getElementById("editDateTime").value;
    const selectedDate = new Date(dateTimeInput);
    const currentDate = new Date();

    if (selectedDate < currentDate) {
      throw new Error("Cannot set date/time in the past");
    }

    const requestBody = {
      type: document.getElementById("editType").value,
      hoursNeeded: parseInt(document.getElementById("editHoursNeeded").value),
      dateTime: selectedDate.toISOString(),
      description: document.getElementById("editDescription").value,
    };

    await postsService.updatePostDetails(postId, requestBody);

    const modal = M.Modal.getInstance(document.getElementById("editPostModal"));
    modal.close();

    M.toast({ html: "Post updated successfully", classes: "green" });
    displayMyPosts();
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

    await postsService.cancelPost(postId);

    M.toast({ html: "Post cancelled successfully", classes: "green" });
    displayMyPosts();
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
    const postData = await postsService.getPostById(postId);
    const selectedDate = getLocalDate(postData.dateTime);

    const typeField = document.getElementById("editType");
    const hoursField = document.getElementById("editHoursNeeded");
    const dateField = document.getElementById("editDateTime");
    const descriptionField = document.getElementById("editDescription");

    typeField.value = postData.type;
    hoursField.disabled = false;
    hoursField.value = postData.hoursNeeded;
    dateField.value = selectedDate;
    descriptionField.value = postData.description;

    if (postData.type === "request") {
      hoursField.disabled = true; // Editable only if it is an offer
    }

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
  const operation = data.updatedPost.status;
  M.toast({
    html: `Post ${data.updatedPost.description} ${operation}.`,
    classes: "green",
  });

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
