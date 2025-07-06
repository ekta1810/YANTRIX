document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  // LOGIN
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form has been sucessfully submitted");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data.token)
        localStorage.setItem("token", data.token);
        window.location.href = `http://localhost:3000/dashboard?token=${data.token}`;
      } else {
        alert("Invalid login credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Error logging in.");
    }
  });


  // SIGNUP
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      const role = document.getElementById("userRole").value;

      try {
        const res = await fetch("http://localhost:3000/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password, role })
        });

        if (res.ok) {
          alert("Signup successful! You can now log in.");
          // Switch to login tab
          const triggerTab = document.querySelector('a[href="#login"]');
          bootstrap.Tab.getOrCreateInstance(triggerTab).show();
        } else {
          const data = await res.json();
          alert(data.message || "Signup failed.");
        }
      } catch (err) {
        console.error("Signup error:", err);
        alert("Error signing up.");
      }
    });
  }
});