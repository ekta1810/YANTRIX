document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Sign Up: Fetch to backend
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const role = document.getElementById('userRole').value;
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      try {
        const res = await fetch('http://localhost:3000/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Signup failed');
          return;
        }

        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
        alert('Account created successfully!');
        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error('Signup error:', err);
        alert('Error during signup.');
      }
    });
  }

  // Login: Fetch to backend
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const username = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Login failed');
          return;
        }

        // Store token & role for later use
        // localStorage.setItem('authToken', data.token);
        // localStorage.setItem('userEmail', email);

        // Decode token to get role
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('userRole', payload.role);

        alert('Logged in successfully!');
        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error('Login error:', err);
        alert('Error during login.');
      }
    });
  }

  // Role-based UI Control (only runs on dashboard)
  const userRole = localStorage.getItem('userRole') || 'member';

  // Show/hide admin-only areas
  if (userRole !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  // Hide project creation form from "member" role
  const projectForm = document.getElementById('projectForm');
  if (projectForm && userRole === 'member') {
    projectForm.style.display = 'none';
  }

  // Display role in top bar
  const topNav = document.querySelector('.top-nav');
  if (topNav) {
    const badge = document.createElement('span');
    badge.className = 'badge bg-dark';
    badge.textContent = `Role: ${userRole.toUpperCase()}`;
    topNav.appendChild(badge);
  }

  // Show default section
  if (typeof showSection === 'function') {
    showSection('tasksSection');
  }

  loadTasks();
  loadProjects();

  // Task Creation
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('taskName').value.trim();
      const status = document.getElementById('taskStatus').value;
      const deadline = document.getElementById('taskDeadline').value;

      if (!name || !deadline) return;

      const task = { name, status, deadline };
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      tasks.push(task);
      localStorage.setItem('tasks', JSON.stringify(tasks));

      renderTask(task);
      taskForm.reset();
    });
  }

  function loadTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    taskList.innerHTML = '';
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.forEach((task, index) => renderTask(task, index));
  }

  function renderTask({ name, status, deadline }, index) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    const today = new Date().toISOString().split('T')[0];
    let deadlineColor = 'bg-success';
    if (deadline < today) deadlineColor = 'bg-danger';
    else if (deadline === today) {
      deadlineColor = 'bg-warning text-dark';
      new Audio('reminder.mp3').play().catch(() => {});
    }

    const card = document.createElement('div');
    card.className = 'col-md-4 mb-3';
    card.innerHTML = `
      <div class="card shadow-sm border-start border-4 border-primary">
        <div class="card-body">
          <h5 class="card-title">${name}</h5>
          <span class="badge bg-info text-dark mb-2">${status}</span>
          <p class="card-text">
            <strong>Deadline:</strong>
            <span class="badge ${deadlineColor}">${deadline}</span>
          </p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-sm btn-outline-primary edit-task">✏️ Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-task">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.delete-task').addEventListener('click', () => {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      tasks.splice(index, 1);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      loadTasks();
    });

    card.querySelector('.edit-task').addEventListener('click', () => {
      document.getElementById('taskName').value = name;
      document.getElementById('taskStatus').value = status;
      document.getElementById('taskDeadline').value = deadline;
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      tasks.splice(index, 1);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      loadTasks();
    });

    taskList.appendChild(card);
  }

  // Project Creation
  const projectFormElement = document.getElementById('projectForm');
  if (projectFormElement) {
    projectFormElement.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('projectName').value.trim();
      const deadline = document.getElementById('projectDeadline').value;
      const description = document.getElementById('projectDescription').value.trim();
      const members = Array.from(document.getElementById('assignedMembers').selectedOptions).map(o => o.value);
      const status = document.getElementById('projectStatus').value;
      const file = document.getElementById('projectFile').files[0];

      const url = file ? URL.createObjectURL(file) : '';
      const project = { name, deadline, description, members, status, fileName: file?.name || '', fileURL: url };
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      projects.push(project);
      localStorage.setItem('projects', JSON.stringify(projects));

      renderProject(project);
      projectFormElement.reset();
    });
  }

  function loadProjects() {
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    savedProjects.forEach(project => renderProject(project));
  }

  function renderProject(project) {
    const today = new Date().toISOString().split('T')[0];
    let deadlineColor = 'bg-success';
    if (project.deadline < today) deadlineColor = 'bg-danger';
    else if (project.deadline === today) deadlineColor = 'bg-warning text-dark';

    let statusColor = 'bg-primary';
    if (project.status === 'Paused') statusColor = 'bg-warning text-dark';
    else if (project.status === 'Completed') statusColor = 'bg-success';

    const membersHTML = project.members.map(m => `<span class="badge bg-secondary me-1">${m}</span>`).join('');
    const fileHTML = project.fileURL ? `<p><strong>📎 Attachment:</strong> <a href="${project.fileURL}" target="_blank">${project.fileName}</a></p>` : '';

    const card = document.createElement('div');
    card.className = 'col-md-6 mb-3';
    card.innerHTML = `
      <div class="card shadow-sm border-start border-4 border-dark ${project.status.toLowerCase()}-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="card-title mb-0">${project.name}</h5>
            <span class="badge ${statusColor}">${project.status}</span>
          </div>
          <p><strong>📝 Description:</strong><br>${project.description || '—'}</p>
          <p><strong>📅 Deadline:</strong> <span class="badge ${deadlineColor}">${project.deadline}</span></p>
          <p><strong>👥 Team:</strong> ${membersHTML || '—'}</p>
          ${fileHTML}
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-sm btn-outline-primary edit-project">✏️ Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-project">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.delete-project').addEventListener('click', () => {
      card.remove();
      deleteProject(project.name);
    });

    document.getElementById('projectList').appendChild(card);
  }

  function deleteProject(name) {
    let projects = JSON.parse(localStorage.getItem('projects') || '[]');
    projects = projects.filter(p => p.name !== name);
    localStorage.setItem('projects', JSON.stringify(projects));
  }
});

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  document.getElementById(sectionId).style.display = 'block';
}

function scrollToCreateTask() {
  const form = document.getElementById('taskForm');
  if (form) {
    form.scrollIntoView({ behavior: 'smooth' });
  }
}