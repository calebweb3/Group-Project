const apiURL = "http://localhost:5501";

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  if (hamburger && navLinks) hamburger.addEventListener("click", () => navLinks.classList.toggle("active"));

  const signupForm = document.getElementById("signupForm");
  if (signupForm) signupForm.addEventListener("submit", handleSignup);

  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const welcomeMessage = document.getElementById("welcomeMessage");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser && welcomeMessage) welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;

  const trackerList = document.querySelector(".trackerList");
  const allBtn = document.querySelector(".allCapsulesBtn");
  const lockedBtn = document.querySelector(".lockedCapsulesBtn");
  const unlockedBtn = document.querySelector(".unlockedCapsulesBtn");
  const profileImg = document.querySelector(".iconCircle img");

  loadProfile(profileImg);
  loadTrackerCapsules(trackerList, "all");

  if (allBtn) allBtn.addEventListener("click", () => loadTrackerCapsules(trackerList, "all"));
  if (lockedBtn) lockedBtn.addEventListener("click", () => loadTrackerCapsules(trackerList, "locked"));
  if (unlockedBtn) unlockedBtn.addEventListener("click", () => loadTrackerCapsules(trackerList, "unlocked"));

  // Tracker Search Input
  const searchInput = document.getElementById("trackerSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      loadTrackerCapsules(trackerList, "all", query);
    });
  }

  const shareBtn = document.querySelector(".shareIcon");
  if (shareBtn) shareBtn.addEventListener("click", handleShare);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const unlockDateInput = document.getElementById('unlock-date');
  if (unlockDateInput) unlockDateInput.setAttribute('min', tomorrow.toISOString().split('T')[0]);

  const capsuleForm = document.getElementById('capsule-form');
  if (capsuleForm) capsuleForm.addEventListener('submit', handleNewCapsule);

  loadHomeCapsules();
});

function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  if (!username || !email || !password || !confirmPassword) return alert("All fields are required!");
  if (password !== confirmPassword) return alert("Passwords do not match!");

  fetch(`${apiURL}/users?email=${email}`)
    .then(res => res.json())
    .then(users => {
      if (users.length > 0) return alert("Email already registered. Try logging in.");
      const newUser = { username, email, password };
      return fetch(`${apiURL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
    })
    .then(res => res?.json())
    .then(() => { 
      alert("Signup successful! Please login."); 
      window.location.href = "login.html"; 
    })
    .catch(err => console.error(err));
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Both fields are required!");

  fetch(`${apiURL}/users?email=${email}&password=${password}`)
    .then(res => res.json())
    .then(users => {
      if (users.length === 1) {
        const user = users[0];
        localStorage.setItem("currentUser", JSON.stringify(user));
        alert(`Welcome back, ${user.username}!`);
        window.location.href = "home.html";
      } else alert("Invalid credentials. Please try again.");
    })
    .catch(err => console.error(err));
}

function loadProfile(img) {
  if (!img) return;
  fetch(`${apiURL}/profile`)
    .then(res => res.json())
    .then(data => img.src = data.profileImage || "img/defaultProfile.png")
    .catch(err => console.error(err));
}

// Updated loadTrackerCapsules with optional searchQuery
function loadTrackerCapsules(container, filter = "all", searchQuery = "") {
  if (!container) return;
  fetch(`${apiURL}/capsules`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";
      let capsules = data.filter(c => c && c.title);
      if (filter === "locked") capsules = capsules.filter(c => c.status === "locked");
      if (filter === "unlocked") capsules = capsules.filter(c => c.status === "unlocked");
      if (searchQuery) capsules = capsules.filter(c => c.title.toLowerCase().includes(searchQuery));

      if (!capsules.length) {
        container.innerHTML = "<p style='text-align:center;color:#252523;margin-top:20px;font-style:italic'>No capsules found!</p>";
        return;
      }

      capsules.forEach(c => {
        const card = document.createElement("div");
        card.className = "trackerCard";
        card.innerHTML = `
          <div class="trackerInfo">
            <h3 class="trackerTitle">${c.title}</h3>
            <p>Opens: ${c.unlockDate ? new Date(c.unlockDate).toLocaleDateString() : 'N/A'}</p>
            <p>Status: ${c.status || 'locked'}</p>
          </div>
          <div class="trackerAction">
            <button onclick="shareCapsule('${c.id}')" class="shareBtn">Share</button>
            <button onclick="deleteCapsule('${c.id}')" class="deleteBtn">Delete</button>
          </div>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => { 
      container.innerHTML = "<p style='text-align:center;color:#50504C;margin-top:20px'>Error loading capsules</p>"; 
      console.error(err); 
    });
}

function handleShare() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!")).catch(() => alert("Failed to copy link."));
  if (navigator.share) navigator.share({ title: 'Time Capsule', text: 'Check out my capsule!', url }).catch(err => console.error(err));
}

function handleNewCapsule(e) {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const message = document.getElementById('message').value;
  const unlockDate = document.getElementById('unlock-date').value;
  const imageFile = document.getElementById('image').files[0];
  const capsule = { title, message, unlockDate, createdDate: new Date().toISOString(), status: "locked", image: null };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = e => { capsule.image = e.target.result; postCapsule(capsule); };
    reader.readAsDataURL(imageFile);
  } else postCapsule(capsule);
}

function postCapsule(capsule) {
  fetch(`${apiURL}/capsules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(capsule)
  })
  .then(res => res.json())
  .then(() => {
    showNotification("Time capsule created successfully!", 5000); 
    const form = document.getElementById('capsule-form'); 
    if (form) form.reset();
    loadHomeCapsules();
    const trackerList = document.querySelector(".trackerList");
    if (trackerList) loadTrackerCapsules(trackerList, "all");
  })
  .catch(err => console.error(err));
}

function loadHomeCapsules() {
  const capsuleContainer = document.querySelector(".capsuleCards");
  if (!capsuleContainer) return;
  fetch(`${apiURL}/capsules`)
    .then(res => res.json())
    .then(capsules => {
      const today = new Date();
      let upcoming = capsules.filter(c => new Date(c.unlockDate) > today);
      upcoming.sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate));
      upcoming = upcoming.slice(0, 3);
      capsuleContainer.innerHTML = '';

      if (!upcoming.length) {
        capsuleContainer.innerHTML = `<p style="text-align:center;color:#50504C;margin-top:20px;">No upcoming capsules yet.</p>`;
        return;
      }

      upcoming.forEach(c => {
        const unlockDate = new Date(c.unlockDate);
        const card = document.createElement('div');
        card.className = 'capsuleCard';
        card.innerHTML = `
          <h3>${c.title}</h3>
          <p>Unlock Date: ${unlockDate.toLocaleDateString()}</p>
          <p>🔒 Capsule is locked</p>
          <button class="viewCapsuleBtn" onclick="openCapsule('${c.id}')">View Capsule</button>
        `;
        capsuleContainer.appendChild(card);
      });
    })
    .catch(err => console.error(err));
}

function openCapsule(id) {
  fetch(`${apiURL}/capsules/${id}`)
    .then(res => res.json())
    .then(c => {
      const today = new Date();
      const unlock = new Date(c.unlockDate);
      if (today >= unlock) alert(`Time Capsule: ${c.title}\n\n${c.message}`);
      else alert(`This time capsule is still locked!\nIt will unlock in ${Math.ceil((unlock-today)/(1000*60*60*24))} day${Math.ceil((unlock-today)/(1000*60*60*24)) !== 1 ? 's' : ''}.`);
    })
    .catch(err => console.error(err));
}

function deleteCapsule(id) {
  fetch(`${apiURL}/capsules/${id}`, { method: "DELETE" })
    .then(() => {
      showNotification("Time capsule deleted successfully!", 5000);
      loadHomeCapsules();
      const trackerList = document.querySelector(".trackerList");
      if (trackerList) loadTrackerCapsules(trackerList, "all");
    })
    .catch(err => console.error(err));
}

function showNotification(msg, duration = 5000) {
  const n = document.getElementById('notification'); 
  if (!n) return;
  n.textContent = msg; 
  n.classList.add('show');

  if (n.hideTimeout) clearTimeout(n.hideTimeout);

  n.hideTimeout = setTimeout(() => {
    n.classList.remove('show');
  }, duration);
}

function shareCapsule(id) {
  const url = `${window.location.origin}/capsule.html?id=${id}`;
  navigator.clipboard.writeText(url)
    .then(() => alert("Capsule link copied!"))
    .catch(() => alert("Failed to copy link."));

  if (navigator.share) {
    navigator.share({ 
      title: 'Time Capsule', 
      text: 'Check out this capsule!', 
      url 
    }).catch(err => console.error(err));
  }
}

const navShareBtn = document.getElementById("navShareBtn");
if (navShareBtn) {
  navShareBtn.addEventListener("click", () => {
    const url = window.location.href; 
    navigator.clipboard.writeText(url)
      .then(() => alert("Page link copied!"))
      .catch(() => alert("Failed to copy link."));

    if (navigator.share) {
      navigator.share({ 
        title: 'Time Capsule', 
        text: 'Check out this page!', 
        url 
      }).catch(err => console.error(err));
    }
  });
}

window.openCapsule = openCapsule;
window.deleteCapsule = deleteCapsule;

