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
  loadNotifications();
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
    addNotification(`New capsule '${capsule.title}' has been created!`);
    showToast("Time capsule created successfully!"); 
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
      if (today >= unlock) {
        alert(`Time Capsule: ${c.title}\n\n${c.message}`);
        addNotification(`Capsule '${c.title}' was unlocked!`);
      } else {
        alert(`This time capsule is still locked!\nIt will unlock in ${Math.ceil((unlock-today)/(1000*60*60*24))} day${Math.ceil((unlock-today)/(1000*60*60*24)) !== 1 ? 's' : ''}.`);
      }
    })
    .catch(err => console.error(err));
}

function deleteCapsule(id) {
  fetch(`${apiURL}/capsules/${id}`, { method: "DELETE" })
    .then(() => {
      addNotification(`Capsule was deleted!`);
      showToast("Time capsule deleted successfully!");
      loadHomeCapsules();
      const trackerList = document.querySelector(".trackerList");
      if (trackerList) loadTrackerCapsules(trackerList, "all");
    })
    .catch(err => console.error(err));
}
function loadNotifications() {
  const feed = document.getElementById("notifications-feed");
  if (!feed) return;

  fetch(`${apiURL}/notifications`)
    .then(res => res.json())
    .then(notifications => {
      feed.innerHTML = "";
      if (!notifications.length) {
        feed.innerHTML = "<p>No notifications yet.</p>";
        return;
      }

      notifications.forEach(n => {
        const notif = document.createElement("div");
        notif.className = `notification-item ${n.type || 'system'}`;
        notif.innerHTML = `
          <div class="icon"></div>
          <div class="message">${n.message}</div>
          <div style="display:flex; align-items:center;">
            <span class="time">${new Date(n.date).toLocaleString()}</span>
            <button class="delete-btn" onclick="deleteNotification('${n.id}')">Delete</button>
          </div>
        `;
        feed.appendChild(notif);
      });
    })
    .catch(err => {
      feed.innerHTML = "<p>Error loading notifications.</p>";
      console.error(err);
    });
}

function addNotification(message, type = 'system') {
  fetch(`${apiURL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, type, date: new Date().toISOString() })
  })
  .then(() => loadNotifications())
  .catch(err => console.error(err));
}

function deleteNotification(id) {
  fetch(`${apiURL}/notifications/${id}`, { method: "DELETE" })
    .then(() => loadNotifications())
    .catch(err => console.error(err));
}

function showToast(message, duration = 4000) {
  const toast = document.createElement("div");
  toast.className = "notification-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => document.body.removeChild(toast), 300);
  }, duration);
}
function handleShare() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!")).catch(() => alert("Failed to copy link."));
  if (navigator.share) navigator.share({ title: 'Time Capsule', text: 'Check out my capsule!', url }).catch(err => console.error(err));
}

function shareCapsule(id) {
  const url = `${window.location.origin}/capsule.html?id=${id}`;
  navigator.clipboard.writeText(url).then(() => alert("Capsule link copied!")).catch(() => alert("Failed to copy link."));
  if (navigator.share) navigator.share({ title: 'Time Capsule', text: 'Check out this capsule!', url }).catch(err => console.error(err));
}

const navShareBtn = document.getElementById("navShareBtn");
if (navShareBtn) {
  navShareBtn.addEventListener("click", () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => alert("Page link copied!")).catch(() => alert("Failed to copy link."));
    if (navigator.share) navigator.share({ title: 'Time Capsule', text: 'Check out this page!', url }).catch(err => console.error(err));
  });
}
window.openCapsule = openCapsule;
window.deleteCapsule = deleteCapsule;


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
            id: Date.now(),
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

    
    capsules = capsules.filter(c => c.id !== id);
    localStorage.setItem('timeCapsules', JSON.stringify(capsules));

    loadCapsules();
    showNotification('Time capsule deleted successfully!');
}


function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}


window.openCapsule = openCapsule;
window.deleteCapsule = deleteCapsule;



// let notificationsEnabled = true;

// function toggleNotifications() {
//     notificationsEnabled = !notificationsEnabled;
//     const toggle = document.getElementById('notificationToggle');

//     if (notificationsEnabled) {
//         toggle.classList.add('active');
//         console.log('Notifications enabled');
//     } else {
//         toggle.classList.remove('active');
//         console.log('Notifications disabled');
//     }
// }


// function openSubAccount() {
//     const modal = document.getElementById('subAccountModal');
//     modal.classList.add('active');
//     console.log('Sub Account opened');
// }

// function closeSubAccount() {
//     const modal = document.getElementById('subAccountModal');
//     modal.classList.remove('active');
// }

// function editSubAccount() {
//     alert('Edit Sub Account functionality - you can add your edit form here!');
//     console.log('Edit Sub Account clicked');
// }

// function deleteSubAccount() {
//     if (confirm('Are you sure you want to delete this sub account?')) {
//         alert('Sub Account deleted successfully!');
//         closeSubAccount();
//         console.log('Sub Account deleted');
//     }
// }


// document.addEventListener('click', function(event) {
//     const modal = document.getElementById('subAccountModal');
//     if (event.target === modal) {
//         closeSubAccount();
//     }
// });


// document.addEventListener('DOMContentLoaded', function() {
//     document.querySelectorAll('.setting-item').forEach(item => {
//         item.addEventListener('click', function() {
            
//             if (!this.onclick || 
//                 (this.onclick.toString().indexOf('toggleNotifications') === -1 && 
//                  this.onclick.toString().indexOf('openSubAccount') === -1)) {
                
//                 this.style.transform = 'scale(0.98)';
//                 setTimeout(() => {
//                     this.style.transform = 'scale(1)';
//                 }, 100);
                
//                 console.log('Clicked on: ' + this.querySelector('.setting-text').textContent);
//             }
//         });
//     });
// });


// function navigateBack() {
//     console.log('Back button clicked');
    
// }

// function openProfile() {
//     console.log('Profile clicked');
    
// }


// document.addEventListener('DOMContentLoaded', function() {
   
//     document.querySelector('.back-icon').addEventListener('click', navigateBack);
    
    
//     document.querySelector('.profile-pic').addEventListener('click', openProfile);
    
    
//     document.querySelectorAll('.nav-icon').forEach((icon, index) => {
//         icon.addEventListener('click', function() {
           
//             document.querySelectorAll('.nav-icon').forEach(i => i.classList.remove('active'));
            
//             this.classList.add('active');
            
//             switch(index) {
//                 case 0:
//                     window.location.href = 'home.html'; 
//                     break;
//                 case 1:
//                     window.location.href = 'calendar.html';
//                     break;
//                 case 2:
//                     window.location.href = 'notifications.html';
//                     break;
//                 case 3:
//                     window.location.href = 'settings.html';
//                     break;
//             }
//         });
//     });
// });

