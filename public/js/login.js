const loginButton = document.querySelector("#login-button");
const loginForm = document.querySelector("#login-form");

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
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } else {
      console.log(data.error);
    }
  } catch (error) {
    console.error("Login failed", error);
  }
};

loginButton.addEventListener("click", (e) => {
  e.preventDefault();
  login(username, password);
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  login(username, password);
});


