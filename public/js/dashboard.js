checkAuth();

// Initialize Materialize components
var elems = document.querySelectorAll("select");
var instances = M.FormSelect.init(elems);

// Initialize modals
var modals = document.querySelectorAll(".modal");
M.Modal.init(modals);

// Form submission handler
const postForm = document.getElementById("postForm");
postForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = {
    userId: document.getElementById("userId").value,
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

    console.log("Server response:", result);

    // Close the modal after successful submission
    const modal = M.Modal.getInstance(document.getElementById("modalForm"));
    modal.close();

    M.toast({ html: "Post created successfully!" });
    postForm.reset();

    // Reinitialize select after form reset
    M.FormSelect.init(elems);
  } catch (error) {
    console.error("Detailed error:", error);
    M.toast({
      html: `Error: ${error.message}`,
      classes: "red",
    });
  }
});

const getPosts = async () => {
  console.log("Fetching posts...");
  try {
    const response = await fetch("/api/posts", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Failed to fetch posts", error);
  }
};

getPosts();
