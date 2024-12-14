const registerForm = document.querySelector(".register-form");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  const email = document.querySelector("#email").value;
  
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, email }),
    });
    const data = await response.json();
    
    if (response.status === 201) {
      M.toast({html: 'Registration successful!', classes: 'green'});
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } else {
      // Only show the toast notification, remove the error div creation
      M.toast({html: data.error || 'Registration failed', classes: 'red'});
    }
  } catch (error) {
    console.error("Register failed", error);
    M.toast({html: 'Registration failed. Please try again.', classes: 'red'});
  }
});