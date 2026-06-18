function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.querySelector('.eye-open').style.display   = showing ? '' : 'none';
  btn.querySelector('.eye-closed').style.display = showing ? 'none' : '';
}

// Redirect away if already logged in
if (AUTH.getAccess()) {
  window.location.href = AUTH.isAdmin() ? '/users/' : '/profile/';
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearError();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('Please enter your username and password.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Logging in…';

  try {
    const res = await fetch('/api/login/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      AUTH.store({
        access:   data.access,
        refresh:  data.refresh,
        username: data.username,
        is_admin: data.is_admin,
      });
      window.location.href = data.is_admin ? '/users/' : '/profile/';
    } else {
      showError(data.detail || 'Invalid username or password.');
    }
  } catch {
    showError('Network error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
});

function showError(msg) {
  const box  = document.getElementById('errorBox');
  const list = document.getElementById('errorList');
  list.innerHTML = `<li>${msg}</li>`;
  box.classList.add('show');
}

function clearError() {
  document.getElementById('errorBox').classList.remove('show');
  document.getElementById('errorList').innerHTML = '';
}
