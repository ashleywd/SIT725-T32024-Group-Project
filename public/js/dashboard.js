verifyUserAuthentication();
const socket = initializeWebSocket();

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
    initializeButtons();
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    M.toast({ html: "Failed to load posts", classes: "red" });
  }
};

const createPost = ({
  postId,
  postedBy,
  type,
  dateTime,
  description,
  hoursNeeded,
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
                dateTime,
              ).toLocaleString()}</p>
              <p>${description}</p>
              <button class="btn waves-effect waves-light" id="send-offer-button" data-post-info="${encodeURIComponent(JSON.stringify({postId, postedBy}))}">
                Accept
                <i class="material-icons right">send</i>
              </button>
          </div>
      </div>
  </div>
`;

const handleOfferHelp = (postInfo) => {
  try {
    const decodedData = decodeURIComponent(postInfo);
    const parseData = JSON.parse(decodedData);
    socket.emit("send-offer", parseData);
  } catch (e) {
    console.error(e);
  }
};

const handleReceiveOffer = (data) => {
  console.log(data);
}

socket.on("receive-offer", handleReceiveOffer);

const initializeButtons = () => {
  const sendOfferButtons = document.querySelectorAll("#send-offer-button");

  if (sendOfferButtons.length > 0) {
    sendOfferButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        if (e.target.matches("button")) {
          const postId = e.target.dataset.postInfo;
          handleOfferHelp(postId);
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
            }),
          )
          .join("")
      : "<p>No posts available.</p>";

  const postContentContainer = document.getElementById("postsContent");
  postContentContainer.innerHTML = postsHtml;
};

getPosts();
