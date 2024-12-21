checkAuth();

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

    const postsHtml =
      posts.length > 0
        ? posts
            .map(
              (post) => `
            <div class="col s12 m6">
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">
                            <i class="material-icons left">
                                ${
                                  post.type === "offer"
                                    ? "person_outline"
                                    : "child_care"
                                }
                            </i>
                            ${
                              post.type === "offer"
                                ? "Babysitting Offer"
                                : "Babysitter Request"
                            }
                        </span>
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
        : "<p>You have no posts yet.</p>";

    document.getElementById("postsContent").innerHTML = postsHtml;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
};

getMyPosts();
