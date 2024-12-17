document.addEventListener("DOMContentLoaded", async () => {
    const postList = document.getElementById("post-list");
    const loggedInUserId = "12345"; // example user ID
  
    try {
      const response = await fetch("/posts");
      const posts = await response.json();
  
      posts.forEach(post => {
        const isOwner = post.userId._id.toString() === loggedInUserId.toString();
  
        const postCard = `
          <div class="col">
            <div class="card">
              <div class="card-title">
                ${post.type.toUpperCase()} - ${post.hoursNeeded} pts
              </div>
              <p><strong>Status:</strong> ${post.status}</p>
              <p><strong>Date:</strong> ${new Date(post.dateTime).toLocaleString()}</p>
              <p>${post.description}</p>
              <div class="card-action">
                ${isOwner 
                  ? '<a href="#" class="red">Edit Post</a>'
                  : '<a href="#">Apply</a>'}
              </div>
            </div>
          </div>
        `;
        postList.innerHTML += postCard;
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  });
  