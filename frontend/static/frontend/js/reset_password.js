function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.querySelector('.eye-open').style.display   = showing ? '' : 'none';
  btn.querySelector('.eye-closed').style.display = showing ? 'none' : '';
}

const token = new URLSearchParams(window.location.search).get('token');

if (!token) {
  showError('No reset token found. Please request a new password reset link.');
  document.getElementById('resetForm').style.display = 'none';
}

document.getElementById('resetForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearError();

  const newPwd     = document.getElementById('newPwd').value;
  const confirmPwd = document.getElementById('confirmPwd').value;

  if (!newPwd || !confirmPwd) {
    showError('Please fill in both password fields.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Resetting…';

  try {
    const res = await fetch('/api/forgot-password/confirm/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, new_password: newPwd, confirm_password: confirmPwd }),
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = '/login/?reset=1';
    } else {
      showError(data.error || 'Something went wrong. Please try again.');
    }
  } catch {
    showError('Network error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reset Password';
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
