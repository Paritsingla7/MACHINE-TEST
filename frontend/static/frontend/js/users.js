let currentPage = 1;
let totalCount  = 0;
const PAGE_SIZE = 10;

async function loadFilterStates() {
  const sel = document.getElementById('filterState');
  try {
    const res = await fetch('/api/states/');
    const data = await res.json();
    data.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
  } catch { /* non-critical, other filters still work */ }
}

function buildQuery(page) {
  const params = new URLSearchParams();
  const name   = document.getElementById('filterName').value.trim();
  const state  = document.getElementById('filterState').value;
  const gender = document.getElementById('filterGender').value;
  if (name)   params.set('name', name);
  if (state)  params.set('state', state);
  if (gender) params.set('gender', gender);
  params.set('page', page);
  return params.toString();
}

async function fetchUsers(page = 1) {
  currentPage = page;
  const container = document.getElementById('tableContainer');
  container.innerHTML = `
    <div class="loading-state">
      <div class="big-spinner"></div>
      <p>Loading…</p>
    </div>`;
  document.getElementById('pagination').style.display = 'none';
  document.getElementById('resultsSummary').textContent = '';

  try {
    const res  = await fetch(`/api/users/?${buildQuery(page)}`);
    const data = await res.json();

    totalCount = data.count || 0;
    const users = data.results || [];

    const summary = document.getElementById('resultsSummary');
    summary.innerHTML = totalCount
      ? `Showing <strong>${users.length}</strong> of <strong>${totalCount}</strong> user${totalCount !== 1 ? 's' : ''}`
      : '';

    if (!users.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <p>No users found. Try adjusting your filters.</p>
        </div>`;
      return;
    }

    container.innerHTML = renderTable(users);
    renderPagination(totalCount, page);

  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Failed to load users. Please refresh the page.</p>
      </div>`;
  }
}

function renderTable(users) {
  const rows = users.map(u => {
    const avatar = u.photo
      ? `<img class="avatar" src="${u.photo}" alt="${esc(u.name)}" />`
      : `<div class="avatar-placeholder">👤</div>`;

    const genderBadge = u.gender === 'M'
      ? `<span class="badge badge-m">Male</span>`
      : `<span class="badge badge-f">Female</span>`;

    const hobbies = Array.isArray(u.hobbies) && u.hobbies.length
      ? `<div class="hobbies-list">${u.hobbies.map(h => `<span class="hobby-tag">${esc(h)}</span>`).join('')}</div>`
      : `<span style="color:#bbb">—</span>`;

    const dob = u.birth_date || '—';

    return `
      <tr>
        <td>
          <div class="avatar-cell">
            ${avatar}
            <span class="user-name">${esc(u.name)}</span>
          </div>
        </td>
        <td>${genderBadge}</td>
        <td>${dob}</td>
        <td>${esc(u.email || '—')}</td>
        <td>${esc(u.phone || u.mobile || '—')}</td>
        <td>${hobbies}</td>
      </tr>`;
  }).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Gender</th>
          <th>DOB</th>
          <th>Email</th>
          <th>Contact</th>
          <th>Hobbies</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderPagination(total, current) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;

  const pag = document.getElementById('pagination');
  pag.style.display = 'flex';
  pag.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '←';
  prev.disabled = current === 1;
  prev.onclick = () => fetchUsers(current - 1);
  pag.appendChild(prev);

  const start = Math.max(1, current - 2);
  const end   = Math.min(totalPages, current + 2);

  if (start > 1) {
    pag.appendChild(makePageBtn(1, current));
    if (start > 2) pag.appendChild(makeDots());
  }

  for (let i = start; i <= end; i++) pag.appendChild(makePageBtn(i, current));

  if (end < totalPages) {
    if (end < totalPages - 1) pag.appendChild(makeDots());
    pag.appendChild(makePageBtn(totalPages, current));
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = '→';
  next.disabled = current === totalPages;
  next.onclick = () => fetchUsers(current + 1);
  pag.appendChild(next);

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `Page ${current} of ${totalPages}`;
  pag.appendChild(info);
}

function makePageBtn(num, current) {
  const btn = document.createElement('button');
  btn.className = 'page-btn' + (num === current ? ' active' : '');
  btn.textContent = num;
  btn.onclick = () => fetchUsers(num);
  return btn;
}

function makeDots() {
  const s = document.createElement('span');
  s.className = 'page-info';
  s.textContent = '…';
  return s;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyFilters() { fetchUsers(1); }

function clearFilters() {
  document.getElementById('filterName').value   = '';
  document.getElementById('filterState').value  = '';
  document.getElementById('filterGender').value = '';
  fetchUsers(1);
}

document.getElementById('filterName').addEventListener('keydown', e => {
  if (e.key === 'Enter') applyFilters();
});

loadFilterStates();
fetchUsers(1);
