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



document.addEventListener('DOMContentLoaded', function() {
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
  document.getElementById('unlock-date').setAttribute('min', tomorrowFormatted);

  
  loadCapsules();

  
  document.getElementById('capsule-form').addEventListener('submit', function(e) {
      e.preventDefault();

      const title = document.getElementById('title').value;
      const message = document.getElementById('message').value;
      const unlockDate = document.getElementById('unlock-date').value;
      const imageFile = document.getElementById('image').files[0];

      
      const capsule = {
          id: Date.now(), // Unique ID
          title,
          message,
          unlockDate,
          createdDate: new Date().toISOString(),
          image: null
      };

      
      if (imageFile) {
          const reader = new FileReader();
          reader.onload = function(e) {
              capsule.image = e.target.result;
              saveCapsule(capsule);
          };
          reader.readAsDataURL(imageFile);
      } else {
          saveCapsule(capsule);
      }
  });
});


function saveCapsule(capsule) {
  const capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];

  capsules.push(capsule);
  localStorage.setItem('timeCapsules', JSON.stringify(capsules));

  loadCapsules();
  showNotification('Time capsule created successfully!');


  document.getElementById('capsule-form').reset();
}


function loadCapsules() {
  const capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];
  const capsuleList = document.getElementById('capsule-list');

  if (capsules.length === 0) {
      capsuleList.innerHTML = `
          <div class="empty-state">
              <p>You haven't created any time capsules yet.</p>
              <p>Create your first one to get started!</p>
          </div>
      `;
      return;
  }

  capsuleList.innerHTML = '';

  capsules.forEach(capsule => {
      const createdDate = new Date(capsule.createdDate).toLocaleDateString();
      const unlockDate = new Date(capsule.unlockDate).toLocaleDateString();

      const capsuleElement = document.createElement('div');
      capsuleElement.className = 'capsule-item';
      capsuleElement.innerHTML = `
          <div class="capsule-title">${capsule.title}</div>
          <div class="capsule-date">Created: ${createdDate} | Unlocks: ${unlockDate}</div>
          <div class="capsule-message">${capsule.message}</div>
          <button onclick="openCapsule(${capsule.id})">View Capsule</button>
          <button onclick="deleteCapsule(${capsule.id})" 
              style="margin-left:10px; color:white; background:red; border:none; padding:5px 10px; border-radius:5px;">
              Delete
          </button>
      `;

      capsuleList.appendChild(capsuleElement);
  });
}

function openCapsule(id) {
  const capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];
  const capsule = capsules.find(c => c.id === id);

  if (!capsule) return;

  const today = new Date();
  const unlockDate = new Date(capsule.unlockDate);

  if (today >= unlockDate) {
      alert(`Time Capsule: ${capsule.title}\n\n${capsule.message}`);
  } else {
      const daysLeft = Math.ceil((unlockDate - today) / (1000 * 60 * 60 * 24));
      alert(`This time capsule is still locked!\nIt will unlock in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`);
  }
}


function deleteCapsule(id) {
  let capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];

  
  capsules = capsules.filter(c => Number(c.id) !== Number(id));

  localStorage.setItem('timeCapsules', JSON.stringify(capsules));

  loadCapsules();
  showNotification('Time capsule deleted successfully!');

  document.addEventListener('click', function(e) {
      if (e.target.matches('.delete-button')) {
          alert('Are you sure you want to delete this capsule? This action cannot be undone.');
      }
  });
}





function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');

  saveNotification(message);

  setTimeout(() => {
      notification.classList.remove('show');
  }, 3000);
}

function saveNotification(message) {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const newNotification = {
    id: Date.now(),
    message,
    time: new Date().toLocaleString()
  };
  notifications.unshift(newNotification);
  localStorage.setItem('notifications', JSON.stringify(notifications));
}


window.openCapsule = openCapsule;
window.deleteCapsule = deleteCapsule;


document.addEventListener('DOMContentLoaded', () => {
  const feed = document.getElementById('notifications-feed');
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

  function renderNotifications() {
    if (notifications.length === 0) {
      feed.innerHTML = `<p>No notifications yet.</p>`;
      return;
    }

    feed.innerHTML = '';
    notifications.forEach(n => {
      const div = document.createElement('div');
      div.className = 'notification-item';
      div.innerHTML = `
        <p class="message">${n.message}</p>
        <p class="time">${n.time}</p>
        <button class="delete-btn" data-id="${n.id}">Delete</button>
      `;
      feed.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.getAttribute('data-id'));
        notifications = notifications.filter(n => n.id !== id);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        renderNotifications();
      });
    });
  }

  renderNotifications();
});



document.addEventListener('DOMContentLoaded', () => {
  const feed = document.getElementById('capsule-feed');
  const capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];

  if (capsules.length === 0) {
    feed.innerHTML = `<p>No capsules yet.</p>`;
    return;
  }

  feed.innerHTML = '';

  const now = new Date();

  capsules.forEach(capsule => {
    const createdDate = new Date(capsule.createdDate).toLocaleString();
    const unlockDate = new Date(capsule.unlockDate);
    const isUnlocked = now >= unlockDate;

    let statusText, cssClass;

    if (isUnlocked) {
      statusText = `🔓 Unlocked on ${unlockDate.toLocaleString()}`;
      cssClass = "unlocked";
    } else {
      const diffMs = unlockDate - now;
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

      statusText = `🔒 Locked - Unlocks in ${days}d ${hours}h ${minutes}m`;
      cssClass = "locked";
    }

    const div = document.createElement('div');
    div.className = `capsule-item ${cssClass}`;
    div.innerHTML = `
      <p class="title">${capsule.title}</p>
      <p class="status">${statusText}</p>
      <p class="time">Created: ${createdDate}</p>
    `;
    feed.appendChild(div);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const feed = document.getElementById('unlocked-feed');
  const capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];
  const now = new Date();

  const unlockedCapsules = capsules.filter(c => new Date(c.unlockDate) <= now);

  if (unlockedCapsules.length === 0) {
    feed.innerHTML = `<p>No unlocked capsules yet.</p>`;
    return;
  }

  feed.innerHTML = '';
  unlockedCapsules.forEach(capsule => {
    const unlockDate = new Date(capsule.unlockDate).toLocaleString();
    const createdDate = new Date(capsule.createdDate).toLocaleString();

    const div = document.createElement('div');
    div.className = 'capsule-item';
    div.innerHTML = `
      <p class="title">${capsule.title}</p>
      <p class="message">${capsule.message}</p>
      ${capsule.image ? `<img src="${capsule.image}" alt="Capsule Image">` : ""}
      <p class="meta">Created: ${createdDate}</p>
      <p class="meta">Unlocked on: ${unlockDate}</p>
      <button class="delete-btn" data-id="${capsule.id}">Delete</button>
    `;
    feed.appendChild(div);
  });

  // Delete functionality
  feed.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const id = e.target.getAttribute('data-id');
      deleteCapsule(id);
    }
  });

  function deleteCapsule(id) {
    let capsules = JSON.parse(localStorage.getItem('timeCapsules')) || [];
    capsules = capsules.filter(c => String(c.id) !== String(id));
    localStorage.setItem('timeCapsules', JSON.stringify(capsules));
    location.reload(); // refresh feed
  }
});

