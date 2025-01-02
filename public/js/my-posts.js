verifyUserAuthentication();

const createMyPost = ({ type, hoursNeeded, dateTime, description }) => `
  <div class="col s12 m6">
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
          </div>
      </div>
  </div>
`;

const renderPosts = (posts) => {
  const postsHtml =
    Array.isArray(posts) && posts.length > 0
      ? posts.map((post) =>
          createMyPost({
            type: post.type,
            hoursNeeded: post.hoursNeeded,
            dateTime: post.dateTime,
            description: post.description,
          }),
        )
      : "<p>You have no posts yet.</p>";

  document.getElementById("postsContent").innerHTML = postsHtml;
};

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

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const posts = await response.json();
    renderPosts(posts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
};

getMyPosts();
