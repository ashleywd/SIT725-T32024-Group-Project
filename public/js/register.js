const registerForm = document.querySelector("#register-form");

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
        console.log(data);
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } else {
      console.log(data.error);
    }
  } catch (error) {
    console.error("Register failed", error);
  }
});
