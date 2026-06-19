if (!AUTH.requireAuth()) { /* already redirecting */ }


function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.querySelector('.eye-open').style.display   = showing ? '' : 'none';
  btn.querySelector('.eye-closed').style.display = showing ? 'none' : '';
}

function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function openChangePwdModal() {
  const modal = document.getElementById('changePwdModal');
  document.getElementById('oldPwd').value     = '';
  document.getElementById('newPwd').value     = '';
  document.getElementById('confirmPwd').value = '';
  document.getElementById('changePwdError').style.display = 'none';
  ['oldPwd', 'newPwd', 'confirmPwd'].forEach(id => {
    document.getElementById(id).type = 'password';
  });
  modal.querySelectorAll('.eye-open').forEach(el  => el.style.display = '');
  modal.querySelectorAll('.eye-closed').forEach(el => el.style.display = 'none');
  modal.classList.add('open');
}

function closePwdModal(e) {
  if (!e || e.target === document.getElementById('changePwdModal')) {
    document.getElementById('changePwdModal').classList.remove('open');
  }
}

async function submitChangePwd() {
  const oldPwd     = document.getElementById('oldPwd').value;
  const newPwd     = document.getElementById('newPwd').value;
  const confirmPwd = document.getElementById('confirmPwd').value;
  const errEl      = document.getElementById('changePwdError');

  errEl.style.display = 'none';

  if (!oldPwd || !newPwd || !confirmPwd) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.style.display = '';
    return;
  }

  const btn = document.getElementById('changePwdBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Updating…';

  try {
    const res = await AUTH.fetch('/api/change-password/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ old_password: oldPwd, new_password: newPwd, confirm_password: confirmPwd }),
    });
    if (!res) return;

    const data = await res.json();

    if (res.ok) {
      document.getElementById('changePwdModal').classList.remove('open');
      showToast('Password updated successfully.');
    } else {
      errEl.textContent = data.error || 'Something went wrong.';
      errEl.style.display = '';
    }
  } catch {
    errEl.textContent = 'Network error. Please try again.';
    errEl.style.display = '';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
}

async function loadProfile() {
  const container = document.getElementById('profileContent');
  container.innerHTML = `
    <div class="loading-state">
      <div class="big-spinner"></div>
      <p>Loading profile…</p>
    </div>`;

  const res = await AUTH.fetch('/api/profile/');
  if (!res) return;

  if (!res.ok) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Failed to load profile. Please refresh the page.</p>
      </div>`;
    return;
  }

  const profile = await res.json();
  renderProfile(profile);
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderProfile(p) {
  const avatar = p.photo
    ? `<img class="avatar-xl" src="${esc(p.photo)}" alt="Profile photo" />`
    : `<div class="avatar-xl-placeholder">👤</div>`;

  const hobbies = Array.isArray(p.hobbies) && p.hobbies.length
    ? `<div class="hobbies-list">${p.hobbies.map(h => `<span class="hobby-tag">${esc(h.name)}</span>`).join('')}</div>`
    : '<span class="muted">—</span>';

  const genderBadge = p.gender === 'M'
    ? `<span class="badge badge-m">Male</span>`
    : `<span class="badge badge-f">Female</span>`;

  const location = p.city ? `${esc(p.city)}, ${esc(p.state)}` : (p.state ? esc(p.state) : '—');

  document.getElementById('profileContent').innerHTML = `
    <div class="profile-layout">

      <div class="profile-photo-col">
        ${avatar}
        <span class="profile-since">Member since<br>${formatDate(p.created_at)}</span>
      </div>

      <div class="profile-info-col">
        <h2 class="profile-name">${esc(p.name)}</h2>
        <span class="profile-username">@${esc(AUTH.getUsername() || '')}</span>

        <div class="profile-acc-fields">
          <div class="paf-row">
            <span class="paf-label">Email</span>
            <span class="paf-value">${p.email ? esc(p.email) : '<span class="muted">—</span>'}</span>
          </div>
        </div>
        <button type="button" class="btn-change-pwd" onclick="openChangePwdModal()">Change Password</button>
      </div>

    </div>

    <div class="profile-grid">
      <div class="profile-field">
        <span class="pf-label">Gender</span>
        <span class="pf-value">${genderBadge}</span>
      </div>
      <div class="profile-field">
        <span class="pf-label">Date of Birth</span>
        <span class="pf-value">${esc(p.birth_date || '—')}</span>
      </div>
      <div class="profile-field">
        <span class="pf-label">Location</span>
        <span class="pf-value">${location}</span>
      </div>
      <div class="profile-field">
        <span class="pf-label">Phone</span>
        <span class="pf-value">${p.phone ? esc(p.phone) : '<span class="muted">—</span>'}</span>
      </div>
      <div class="profile-field profile-field--wide">
        <span class="pf-label">Mobile</span>
        <span class="pf-value">${p.mobile ? esc(p.mobile) : '<span class="muted">—</span>'}</span>
      </div>
      <div class="profile-field profile-field--wide">
        <span class="pf-label">Hobbies</span>
        <span class="pf-value">${hobbies}</span>
      </div>
    </div>`;
}

loadProfile();
