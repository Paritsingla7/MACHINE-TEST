document.getElementById('forgotForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearError();

  const email = document.getElementById('email').value.trim();
  if (!email) {
    showError('Please enter your email address.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Sending…';

  try {
    const res = await fetch('/api/forgot-password/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('forgotForm').style.display = 'none';
      const box = document.getElementById('successBox');
      box.textContent = data.message || 'If an account with that email exists, a reset link has been sent.';
      box.style.display = '';
    } else {
      showError(data.error || 'Something went wrong. Please try again.');
    }
  } catch {
    showError('Network error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Reset Link';
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
