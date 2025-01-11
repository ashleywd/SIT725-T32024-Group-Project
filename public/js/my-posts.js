verifyUserAuthentication();
activateWebSocket();

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
    renderPosts(posts);
    initializeButtons();
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
};

const completedButton = ({ postId, postedBy }) => `
  <div class="col s6">
    <a href="#" 
      id="completed-button"
      class="waves-effect waves-light btn green"
      data-post-info="${encodeURIComponent(
        JSON.stringify({ postId, postedBy })
      )}"
    >
      <i class="material-icons left">check</i>Complete
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
      ${getCardActions(_id, status, dateTime, postedBy)}
    </div>
  </div>
 `;

const getCardActions = (id, status, dateTime, postedBy) => {
  if (status === "completed" || status === "cancelled") return "";

  const cancelButton = `
    <div class="col s6">
      <a href="#" class="cancel-post waves-effect waves-light btn red" data-post-id="${id}">
        <i class="material-icons left">cancel</i>Cancel
      </a>
    </div>
  `;

  if (status === "accepted") {
    return `
      <div class="card-action">
        <div class="row">
          ${completedButton({ postId: id, postedBy })}
          ${cancelButton}
        </div>
      </div>
    `;
  }

  return `
    <div class="card-action">
      <div class="row">
        <div class="col s6">
          <a href="#" class="edit-post waves-effect waves-light btn blue" data-post-id="${id}" data-datetime="${dateTime}">
            <i class="material-icons left">edit</i>Edit
          </a>
        </div>
        ${cancelButton}
      </div>
    </div>
  `;
};

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

    M.toast({ html: "Post marked as completed", classes: "green" });
    getMyPosts();
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

    if (selectedDate < new Date()) {
      throw new Error("Cannot set date/time in the past");
    }

    const requestBody = {
      type: document.getElementById("editType").value,
      hoursNeeded: parseInt(document.getElementById("editHoursNeeded").value),
      dateTime: selectedDate.toISOString(),
      description: document.getElementById("editDescription").value,
    };

    const response = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to update post");
    }

    const modal = M.Modal.getInstance(document.getElementById("editPostModal"));
    modal.close();

    M.toast({ html: "Post updated successfully", classes: "green" });
    getMyPosts();
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

    const token = localStorage.getItem("token");
    const response = await fetch(`/api/posts/cancel/${postId}`, {
      method: "PUT",
      headers: {
        Authorization: token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to cancel post");
    }

    M.toast({ html: "Post cancelled successfully", classes: "green" });
    getMyPosts();
  } catch (error) {
    console.error("Error cancelling post:", error);
    M.toast({ html: error.message || "Failed to cancel post", classes: "red" });
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
  const completedButtons = document.querySelectorAll("#completed-button");
  if (completedButtons.length > 0) {
    completedButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const postInfo = e.currentTarget.dataset.postInfo;
        handleMarkCompleted(postInfo);
      });
    });
  }

  document.querySelectorAll(".edit-post").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target.closest(".edit-post");
      if (!target) return;
      const postId = target.dataset.postId;
      const postElement = document.getElementById(`post-${postId}`);

      try {
        const type = postElement
          .querySelector(".card-title")
          .textContent.includes("Offer")
          ? "offer"
          : "request";

        const hoursNeeded = postElement
          .querySelector(".section p:nth-child(1)")
          .textContent.replace(/[^0-9.]/g, "");

        const originalDateTime = target.dataset.datetime;
        const date = new Date(originalDateTime);
        const localDateTime = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);

        const description = postElement
          .querySelector(".section p:nth-child(3)")
          .textContent.replace(/^.*?description.*?/, "")
          .trim();

        // Set values in modal
        document.getElementById("editType").value = type;
        document.getElementById("editHoursNeeded").value = hoursNeeded;
        document.getElementById("editDateTime").value = localDateTime;
        document.getElementById("editDescription").value = description;

        // Initialize and open modal
        const modal = M.Modal.init(document.getElementById("editPostModal"));
        modal.open();

        // Set up save button
        document.getElementById("saveEditButton").onclick = () => {
          handleEditPost(postId);
        };

        // Reinitialize Materialize select
        M.FormSelect.init(document.getElementById("editType"));
        M.updateTextFields();
      } catch (error) {
        console.error("Error parsing date:", error);
        M.toast({ html: "Error opening edit form", classes: "red" });
      }
    });
  });

  document.querySelectorAll(".cancel-post").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target.closest(".cancel-post");
      if (!target) return;
      const postId = target.dataset.postId;
      handleCancelPost(postId);
    });
  });
};

// Initialize Materialize components
M.Modal.init(document.querySelectorAll(".modal"));
M.FormSelect.init(document.querySelectorAll("select"));

// Start the application
getMyPosts();
