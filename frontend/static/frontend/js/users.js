let currentPage     = 1;
let totalCount      = 0;
let currentOrdering = '-created_at';
let currentPageSize = 10;

const COLUMNS = [
  { key: 'registered', label: 'Registered',    fields: ['created_at'] },
  { key: 'name',       label: 'Name / Email',  fields: ['name', 'photo', 'email'] },
  { key: 'gender',     label: 'Gender',        fields: ['gender'] },
  { key: 'dob',        label: 'Date of Birth', fields: ['birth_date'] },
  { key: 'contact',    label: 'Contact',       fields: ['phone', 'mobile'] },
  { key: 'location',   label: 'Location',      fields: ['state', 'city'] },
  { key: 'hobbies',    label: 'Hobbies',       fields: ['hobbies'] },
];

const visibleCols = Object.fromEntries(COLUMNS.map(c => [c.key, true]));

async function loadFilterStates() {
  const sel = document.getElementById('filterState');
  try {
    const res  = await fetch('/api/states/');
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
  params.set('ordering', currentOrdering);
  params.set('page', page);
  params.set('page_size', currentPageSize);
  const fields = ['id'];
  COLUMNS.forEach(c => { if (visibleCols[c.key]) fields.push(...c.fields); });
  params.set('fields', fields.join(','));
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

function sortBy(field) {
  if (currentOrdering === field)            currentOrdering = '-' + field;
  else if (currentOrdering === '-' + field) currentOrdering = '-created_at';
  else                                      currentOrdering = field;
  fetchUsers(1);
}

function resetOrdering() {
  currentOrdering = '-created_at';
  fetchUsers(1);
}

function sortIcon(field) {
  if (currentOrdering === field)       return '<span class="sort-active">↑</span>';
  if (currentOrdering === '-' + field) return '<span class="sort-active">↓</span>';
  return '<span class="sort-neutral">↕</span>';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderTable(users) {
  const vis = visibleCols;

  const rows = users.map(u => {
    const avatar = u.photo
      ? `<img class="avatar" src="${u.photo}" alt="${esc(u.name)}" />`
      : `<div class="avatar-placeholder">👤</div>`;

    const genderBadge = u.gender === 'M'
      ? `<span class="badge badge-m">Male</span>`
      : `<span class="badge badge-f">Female</span>`;

    const hobbies = Array.isArray(u.hobbies) && u.hobbies.length
      ? `<div class="hobbies-list">${u.hobbies.map(h => `<span class="hobby-tag">${esc(h.name)}</span>`).join('')}</div>`
      : `<span class="muted">—</span>`;

    const location = u.city
      ? `${esc(u.city)}, ${esc(u.state)}`
      : (u.state ? esc(u.state) : '<span class="muted">—</span>');

    let contact;
    if (u.phone && u.mobile) {
      contact = `<span class="contact-line">${esc(u.phone)}</span><span class="contact-line contact-sub">${esc(u.mobile)}</span>`;
    } else {
      contact = u.phone ? esc(u.phone) : (u.mobile ? esc(u.mobile) : '<span class="muted">—</span>');
    }

    return `
      <tr>
        <td></td>
        ${vis.registered ? `<td class="date-cell">${formatDate(u.created_at)}</td>` : ''}
        ${vis.name ? `<td>
          <div class="avatar-cell">
            ${avatar}
            <div class="name-email">
              <span class="user-name">${esc(u.name)}</span>
              ${u.email ? `<span class="user-email">${esc(u.email)}</span>` : ''}
            </div>
          </div>
        </td>` : ''}
        ${vis.gender ? `<td>${genderBadge}</td>` : ''}
        ${vis.dob ? `<td>${esc(u.birth_date || '—')}</td>` : ''}
        ${vis.contact ? `<td>${contact}</td>` : ''}
        ${vis.location ? `<td class="location-cell">${location}</td>` : ''}
        ${vis.hobbies ? `<td>${hobbies}</td>` : ''}
      </tr>`;
  }).join('');

  return `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="th-reset"><button class="sort-reset-btn" onclick="resetOrdering()" title="Reset sort order">↺</button></th>
            ${vis.registered ? `<th class="sortable" onclick="sortBy('created_at')">Registered ${sortIcon('created_at')}</th>` : ''}
            ${vis.name ? `<th class="sortable" onclick="sortBy('name')">Name / Email ${sortIcon('name')}</th>` : ''}
            ${vis.gender ? `<th class="sortable" onclick="sortBy('gender')">Gender ${sortIcon('gender')}</th>` : ''}
            ${vis.dob ? `<th class="sortable" onclick="sortBy('birth_date')">DOB ${sortIcon('birth_date')}</th>` : ''}
            ${vis.contact ? `<th>Contact</th>` : ''}
            ${vis.location ? `<th class="sortable" onclick="sortBy('state')">Location ${sortIcon('state')}</th>` : ''}
            ${vis.hobbies ? `<th>Hobbies</th>` : ''}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPagination(total, current) {
  const totalPages = Math.ceil(total / currentPageSize);
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

  const goWrap = document.createElement('span');
  goWrap.className = 'page-goto';
  goWrap.innerHTML = `<span class="page-goto-label">Go to</span>
    <input type="number" class="page-goto-input" min="1" max="${totalPages}" placeholder="${current}"
      onkeydown="if(event.key==='Enter'){gotoPage(this.value,${totalPages})}" />`;
  pag.appendChild(goWrap);
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

function setPageSize(val) {
  currentPageSize = parseInt(val, 10);
  fetchUsers(1);
}

function openCustomPageSize() {
  const sel = document.getElementById('filterPageSize');
  const inp = document.getElementById('customPageSize');
  sel.style.display = 'none';
  inp.style.display = '';
  inp.value = currentPageSize;
  inp.focus();
  inp.select();
}

function applyCustomPageSizeValue(val) {
  const sel = document.getElementById('filterPageSize');
  const prev = sel.querySelector('[data-custom]');
  if (prev) prev.remove();
  let found = false;
  for (const opt of sel.options) {
    if (parseInt(opt.value, 10) === val) { found = true; break; }
  }
  if (!found) {
    const opt = new Option(String(val), String(val));
    opt.dataset.custom = '1';
    let inserted = false;
    for (const opt2 of Array.from(sel.options)) {
      if (parseInt(opt2.value, 10) > val) { sel.insertBefore(opt, opt2); inserted = true; break; }
    }
    if (!inserted) sel.appendChild(opt);
  }
  sel.value = String(val);
}

function closeCustomPageSize() {
  const sel = document.getElementById('filterPageSize');
  const inp = document.getElementById('customPageSize');
  const val = parseInt(inp.value, 10);
  if (!isNaN(val) && val >= 1 && val <= 100) {
    currentPageSize = val;
    applyCustomPageSizeValue(val);
    fetchUsers(1);
  }
  inp.style.display = 'none';
  sel.style.display = '';
}

function handleCustomPageSize(e) {
  if (e.key === 'Enter')  { e.target.blur(); }
  if (e.key === 'Escape') {
    document.getElementById('customPageSize').style.display = 'none';
    document.getElementById('filterPageSize').style.display = '';
  }
}

function gotoPage(val, max) {
  const p = parseInt(val, 10);
  if (!isNaN(p) && p >= 1 && p <= max) fetchUsers(p);
}

function toggleCol(key, checked) {
  visibleCols[key] = checked;
  fetchUsers(currentPage);
}

function toggleColPanel() {
  document.getElementById('colPanel').classList.toggle('open');
}

function initColPanel() {
  const panel = document.getElementById('colPanel');
  panel.innerHTML = COLUMNS.map(c => `
    <label class="col-check-item">
      <input type="checkbox" checked onchange="toggleCol('${c.key}', this.checked)" />
      ${c.label}
    </label>
  `).join('');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.col-toggle-wrap')) {
    document.getElementById('colPanel').classList.remove('open');
  }
});

function applyFilters() { fetchUsers(1); }

function clearFilters() {
  document.getElementById('filterName').value   = '';
  document.getElementById('filterState').value  = '';
  document.getElementById('filterGender').value = '';
  const sel = document.getElementById('filterPageSize');
  const customOpt = sel.querySelector('[data-custom]');
  if (customOpt) customOpt.remove();
  sel.value = '10';
  currentOrdering = '-created_at';
  currentPageSize = 10;
  COLUMNS.forEach(c => visibleCols[c.key] = true);
  document.querySelectorAll('#colPanel input[type=checkbox]').forEach(cb => cb.checked = true);
  fetchUsers(1);
}

document.getElementById('filterName').addEventListener('keydown', e => {
  if (e.key === 'Enter') applyFilters();
});

loadFilterStates();
initColPanel();
fetchUsers(1);
