checkAuth();

// Initialize Materialize components
var elems = document.querySelectorAll("select");
M.FormSelect.init(elems);

var modals = document.querySelectorAll(".modal");
M.Modal.init(modals);

// Form submission handler
const postForm = document.getElementById("postForm");
postForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = {
    type: document.getElementById("type").value,
    hoursNeeded: parseFloat(document.getElementById("hoursNeeded").value),
    description: document.getElementById("description").value,
    dateTime: document.getElementById("dateTime").value,
  };

  try {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
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
});

const getPosts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    document.getElementById("loadingIndicator").style.display = "block";
    document.getElementById("postsContent").innerHTML = "";

    const response = await fetch("/api/posts", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      throw new Error("Failed to fetch posts");
    }

    const posts = await response.json();
    renderPosts(posts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  } finally {
    document.getElementById("loadingIndicator").style.display = "none";
  }
};

const renderPosts = (posts) => {
  const postsHtml =
    Array.isArray(posts) && posts.length > 0
      ? posts
          .map(
            (post) => `
            <div class="col s12 m6">
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">${
                          post.type === "offer"
                            ? "Babysitting Offer"
                            : "Babysitter Request"
                        }</span>
                        <p><strong>Posted by:</strong> ${
                          post.userId?.username || "Unknown"
                        }</p>
                        <p><strong>Hours:</strong> ${post.hoursNeeded}</p>
                        <p><strong>Date:</strong> ${new Date(
                          post.dateTime
                        ).toLocaleString()}</p>
                        <p>${post.description}</p>
                    </div>
                </div>
            </div>
        `
          )
          .join("")
      : "<p>No posts available.</p>";

  document.getElementById("postsContent").innerHTML = postsHtml;
};

getPosts();
