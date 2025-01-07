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
  <div class="center-align">
    <a
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
  <div id="post" class="col s6">
      <div class="card">
          <div class="card-content">
              <span class="card-title">
                  <i class="material-icons left">
                    ${type === "offer" ? "person_outline" : "child_care"}
                  </i>
                  ${
                    type === "offer"
                      ? "Babysitting Offer"
                      : "Babysitter Request"
                  }
              </span>
              <p><strong>Hours:</strong> ${hoursNeeded}</p>
              <p><strong>Date:</strong> ${new Date(
                dateTime,
              ).toLocaleString()}</p>
              <p>${description}</p>
              <p>
                <strong>Status:</strong> ${String(status).toUpperCase()}
              </p>
              ${status === "accepted" ? completedButton({ postId: _id, postedBy }) : ""}
          </div>
      </div>
  </div>
`;

const handleMarkCompleted = async (postInfo) => {
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
      body: JSON.stringify({ postId, postedBy, status: "completed" }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Server error: ${result.error || "Unknown error"}`);
    }
    getMyPosts();
  } catch (e) {
    console.error(e);
  }
};

const initializeButtons = () => {
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
};

const renderPosts = (posts) => {
  const postsHtml =
    Array.isArray(posts) && posts.length > 0
      ? posts.map((post) => createMyPost(post)).join("")
      : "<p>You have no posts yet.</p>";

  document.getElementById("postsContent").innerHTML = postsHtml;
};

getMyPosts();
