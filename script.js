const apiURL = "http://localhost:5500/users";
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }
});
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!username || !email || !password || !confirmPassword) {
      alert("All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    fetch(`${apiURL}?email=${email}`)
      .then(res => res.json())
      .then(users => {
        if (users.length > 0) {
          alert("Email already registered. Try logging in.");
        } else {
          const newUser = { username, email, password };

          fetch(apiURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
          })
            .then(res => res.json())
            .then(data => {
              alert("Signup successful! Please login.");
              window.location.href = "login.html";
            })
            .catch(err => console.error("Signup error:", err));
        }
      });
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Both fields are required!");
      return;
    }

    fetch(`${apiURL}?email=${email}&password=${password}`)
      .then(res => res.json())
      .then(users => {
        if (users.length === 1) {
          const user = users[0];
          localStorage.setItem("currentUser", JSON.stringify(user));
          alert(`Welcome back, ${user.username}!`);
          window.location.href = "home.html";
        } else {
          alert("Invalid credentials. Please try again.");
        }
      })
      .catch(err => console.error("Login error:", err));
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const welcomeMessage = document.getElementById("welcomeMessage");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (currentUser && welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const trackerList = document.querySelector(".trackerList");
  const allBtn = document.querySelector(".allCapsulesBtn");
  const lockedBtn = document.querySelector(".lockedCapsulesBtn");
  const unlockedBtn = document.querySelector(".unlockedCapsulesBtn");
  const profileImg = document.querySelector(".iconCircle img");

  function loadProfile() {
    if (!profileImg) return;

    fetch("db.json")
      .then(res => {
        if (!res.ok) throw new Error("db.json not found");
        return res.json();
      })
      .then(data => {
        profileImg.src = data.profileImage || "img/defaultProfile.png";
      })
      .catch(err => console.error("Error loading profile:", err));
  }

  function loadCapsules(filter = "all") {
    if (!trackerList) return;

    fetch("db.json")
      .then(res => {
        if (!res.ok) throw new Error("db.json not found");
        return res.json();
      })
      .then(data => {
        trackerList.innerHTML = ""; 
        let capsules = data.capsules || [];

        if (filter === "locked") capsules = capsules.filter(c => c.status === "locked");
        if (filter === "unlocked") capsules = capsules.filter(c => c.status === "unlocked");

        if (capsules.length === 0) {
          const msg = document.createElement("p");
          msg.textContent = "No capsules yet, add one and see the magic happen!";
          msg.style.textAlign = "center";
          msg.style.fontSize = "20px";
          msg.style.color = "#252523";
          msg.style.fontStyle = "italic";
          msg.style.fontWeight = "600"
          msg.style.marginTop = "20px, auto";
          trackerList.appendChild(msg);
          return;
        }

        capsules.forEach(c => {
          const card = document.createElement("div");
          card.className = "trackerCard";
          card.innerHTML = `
            <h3>${c.title}</h3>
            <p>${c.date}</p>
            <p>Status: ${c.status}</p>
          `;
          trackerList.appendChild(card);
        });
      })
      .catch(err => {
        console.error("Error loading capsules:", err);
        trackerList.innerHTML = "<p style='text-align:center;color:#50504C;margin-top:20px'>Error loading capsules</p>";
      });
  }

  if (allBtn) allBtn.addEventListener("click", () => loadCapsules("all"));
  if (lockedBtn) lockedBtn.addEventListener("click", () => loadCapsules("locked"));
  if (unlockedBtn) unlockedBtn.addEventListener("click", () => loadCapsules("unlocked"));

  loadProfile();
  loadCapsules();
});
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.querySelector(".shareIcon");
  
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const url = window.location.href;

      navigator.clipboard.writeText(url)
        .then(() => alert("Link copied to clipboard!"))
        .catch(() => alert("Failed to copy link."));

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Time Capsule',
            text: 'Check out my capsule!',
            url: url
          });
        } catch(err) {
          console.error("Share failed:", err);
        }
      } else {
        console.log("Sharing not supported on this device.");
      }
    });
  }
});
