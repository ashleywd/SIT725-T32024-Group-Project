verifyUserAuthentication();
activateWebSocket();

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
      throw new Error(`Server error: ${result.error || "Unknown error"}`);
    }

    const modal = M.Modal.getInstance(document.getElementById("modalForm"));
    modal.close();
    M.toast({ html: "Post created successfully!" });
    postForm.reset();
    M.FormSelect.init(document.querySelectorAll("select"));
    getPosts(); // Refresh posts after creating new one
  } catch (error) {
    console.error("Error creating post:", error);
    M.toast({ html: error.message, classes: "red" });
  }
};

postForm.addEventListener("submit", handleSubmitForm);

let allPosts = []; // Store all posts for filtering

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
    allPosts = posts; // Store all posts
    filterAndRenderPosts();
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
};

const filterPosts = (typeFilter, statusFilter) => {
  return allPosts.filter((post) => {
    const matchesType = typeFilter === "all" || post.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    return matchesType && matchesStatus;
  });
};

const filterAndRenderPosts = () => {
  const typeFilter = document.getElementById("typeFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;
  const filteredPosts = filterPosts(typeFilter, statusFilter);
  renderPosts(filteredPosts);
  initializeButtons();
};

// Initialize both filter selects
const filterSelects = document.querySelectorAll("select");
M.FormSelect.init(filterSelects);
filterSelects.forEach((select) => {
  select.addEventListener("change", filterAndRenderPosts);
});

const DISABLE_STATES = ["accepted", "completed"];

const POST_LABEL = {
  open: "Accept",
  accepted: "Pending completition",
  completed: "Completed",
};

const acceptButtonComponent = ({ status, postId, postedBy }) => `
  <div class="center-align">
    <button
      id="accept-post-button"
      class="btn waves-effect waves-light ${
        DISABLE_STATES.includes(status) && "disabled"
      }"
      data-post-info="${encodeURIComponent(
        JSON.stringify({ postId, postedBy })
      )}"
      >
        ${POST_LABEL[status]}
    </button>
  </div>
`;

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
      <div class="card">
          <div class="card-content">
              <span class="card-title">${
                type === "offer" ? "Babysitting Offer" : "Babysitter Request"
              }</span>
              <p><strong>Posted by:</strong> ${postedBy?.username}</p>
              <p><strong>Hours:</strong> ${hoursNeeded}</p>
              <p><strong>Date:</strong> ${new Date(
                dateTime
              ).toLocaleString()}</p>
              <p>${description}</p>
              <strong>Status:</strong> ${String(status).toUpperCase()}
              ${
                status === "open"
                  ? acceptButtonComponent({ status, postId, postedBy })
                  : ""
              }
          </div>
      </div>
  </div>
`;

const handleAcceptPost = async (postInfo) => {
  const userToken = localStorage.getItem("token");
  try {
    const decodedData = decodeURIComponent(postInfo);
    const { postId, postedBy } = JSON.parse(decodedData);

    const response = await fetch("/api/posts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: userToken,
      },
      body: JSON.stringify({ postId, postedBy, status: "accepted" }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Server error: ${result.error || "Unknown error"}`);
    }
    getPosts();
  } catch (e) {
    console.error(e);
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

getPosts();
