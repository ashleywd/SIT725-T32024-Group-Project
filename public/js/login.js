const loginButton = document.querySelector("#login-button");
const loginForm = document.querySelector(".login-form");

const login = async () => {
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  
  try {
    const response = await fetch("api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    
    if (response.status === 200) {
      M.toast({html: 'Login successful!', classes: 'green'});
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      window.location.href = "/dashboard";
    } else {
      M.toast({html: data.error || 'Login failed', classes: 'red'});
    }
  } catch (error) {
    console.error("Login failed", error);
    M.toast({html: 'Login failed. Please try again.', classes: 'red'});
  }
};

const handleSubmit = (e) => {
  e.preventDefault();
  login();
};

loginButton.addEventListener("click", handleSubmit);
loginForm.addEventListener("submit", handleSubmit);