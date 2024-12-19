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

document.addEventListener('DOMContentLoaded', function() {
   fetchUserPoints();
});

const getPosts = async () => {
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

const fetchUserPoints = async () => {
  try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/account/points', {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
              Authorization: token,
          },
      });

      if (!response.ok) {
          throw new Error('Failed to fetch user points');
      }     
      
      const data = await response.json();
      const pointsBadge = document.getElementById('pointsBadge');
      const points = data.points || 0;
      pointsBadge.innerText = `${points} points`;
  } catch (err) {
      console.error('Error fetching user points:', err.message);
  }
};

getPosts();
