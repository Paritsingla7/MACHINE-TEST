if (!AUTH.requireAuth()) { /* already redirecting */ }

const EYE_OPEN = `<svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg class="eye-closed" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

let _pwdVisible = false;

function togglePwd(btn) {
  _pwdVisible = !_pwdVisible;
  const dots = document.getElementById('pwdMask');
  dots.textContent = _pwdVisible ? '(not stored)' : '••••••••';
  btn.querySelector('.eye-open').style.display   = _pwdVisible ? 'none' : '';
  btn.querySelector('.eye-closed').style.display = _pwdVisible ? '' : 'none';
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
          <div class="paf-row">
            <span class="paf-label">Password</span>
            <div class="paf-pwd-wrap">
              <span class="pwd-mask" id="pwdMask">••••••••</span>
              <button type="button" class="eye-btn" onclick="togglePwd(this)" title="Passwords are not stored in the browser">
                ${EYE_OPEN}${EYE_CLOSED}
              </button>
              <button type="button" class="btn-change-pwd">Change Password</button>
            </div>
          </div>
        </div>
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
