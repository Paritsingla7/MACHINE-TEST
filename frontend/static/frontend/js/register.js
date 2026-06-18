// ── States / Cities loading ───────────────────────────────────────────────────

async function loadStates() {
  const sel = document.getElementById('state');
  try {
    const res = await fetch('/api/states/');
    const data = await res.json();
    sel.innerHTML = '<option value="">Select state</option>';
    data.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
  } catch {
    sel.innerHTML = '<option value="">Failed to load states</option>';
  }
}

document.getElementById('state').addEventListener('change', async function () {
  const citySelect = document.getElementById('city');
  const stateId = this.value;

  citySelect.innerHTML = '<option value="">Loading…</option>';
  citySelect.disabled = true;

  validateField('state');

  if (!stateId) {
    citySelect.innerHTML = '<option value="">Select a state first</option>';
    return;
  }

  try {
    const res = await fetch(`/api/cities/?state_id=${stateId}`);
    const data = await res.json();
    if (!data.length) {
      citySelect.innerHTML = '<option value="">No cities available</option>';
      return;
    }
    citySelect.innerHTML = '<option value="">Select city (optional)</option>';
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  } catch {
    citySelect.innerHTML = '<option value="">Failed to load cities</option>';
  }
});

// ── Photo preview ─────────────────────────────────────────────────────────────

document.getElementById('photo').addEventListener('change', function () {
  const file = this.files[0];
  const area = document.getElementById('photoUploadArea');
  const preview = document.getElementById('photoPreview');
  const fileName = document.getElementById('fileName');

  if (file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      setFieldError('photo', 'Photo must be JPG or PNG.');
    } else {
      clearFieldError('photo');
    }
    area.classList.add('has-file');
    fileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.classList.add('show');
    };
    reader.readAsDataURL(file);
  } else {
    clearFieldError('photo');
    area.classList.remove('has-file');
    preview.classList.remove('show');
    fileName.textContent = '';
  }
});

// ── Field-level validation helpers ───────────────────────────────────────────

function setFieldError(field, msg) {
  const errEl = document.getElementById(`err-${field}`);
  if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
  const inputEl = document.getElementById(field);
  if (inputEl) inputEl.classList.add('error');
}

function clearFieldError(field) {
  const errEl = document.getElementById(`err-${field}`);
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
  const inputEl = document.getElementById(field);
  if (inputEl) inputEl.classList.remove('error');
}

// Returns error message string or null if valid
function validateField(field) {
  const el = document.getElementById(field);

  if (field === 'name') {
    const val = el.value.trim();
    if (!val) return setFieldError('name', 'Full name is required.') || 'err';
    if (val.length > 25) return setFieldError('name', 'Name cannot exceed 25 characters.') || 'err';
    clearFieldError('name');
    return null;
  }

  if (field === 'birth_date') {
    const val = el.value.trim();
    if (!val) return setFieldError('birth_date', 'Date of birth is required.') || 'err';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val))
      return setFieldError('birth_date', 'Use DD/MM/YYYY format (e.g. 25/01/1995).') || 'err';
    const [dd, mm, yyyy] = val.split('/').map(Number);
    const selected = new Date(yyyy, mm - 1, dd);
    if (selected.getDate() !== dd || selected.getMonth() !== mm - 1 || selected.getFullYear() !== yyyy)
      return setFieldError('birth_date', 'Invalid date.') || 'err';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selected > today) return setFieldError('birth_date', 'Date of birth cannot be in the future.') || 'err';
    clearFieldError('birth_date');
    return null;
  }

  if (field === 'email') {
    const val = el.value.trim();
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return setFieldError('email', 'Enter a valid email address.') || 'err';
    }
    clearFieldError('email');
    return null;
  }

  if (field === 'phone') {
    const val = el.value.trim();
    if (val && !/^\d{10}$/.test(val)) {
      return setFieldError('phone', 'Phone must be exactly 10 digits.') || 'err';
    }
    clearFieldError('phone');
    return null;
  }

  if (field === 'mobile') {
    const val = el.value.trim();
    if (val && !/^\d{10}$/.test(val)) {
      return setFieldError('mobile', 'Mobile must be exactly 10 digits.') || 'err';
    }
    clearFieldError('mobile');
    return null;
  }

  if (field === 'state') {
    if (!el.value) return setFieldError('state', 'Please select a state.') || 'err';
    clearFieldError('state');
    return null;
  }

  return null;
}

// ── T&C toggle — enabled only when all client validations pass ────────────────

function refreshTnc() {
  const tnc = document.getElementById('tnc');
  const tncGroup = document.getElementById('tncGroup');
  const hasErrors = runClientValidation() !== null;
  tnc.disabled = hasErrors;
  if (hasErrors) {
    tnc.checked = false;
    tncGroup.classList.add('tnc-disabled');
  } else {
    tncGroup.classList.remove('tnc-disabled');
  }
}

// ── Blur listeners for instant feedback ──────────────────────────────────────

['name', 'email', 'phone', 'mobile'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('blur', () => { validateField(id); refreshTnc(); });
    el.addEventListener('input', () => refreshTnc());
  }
});

// Flatpickr for birth_date — DD/MM/YYYY calendar picker
flatpickr('#birth_date', {
  dateFormat: 'd/m/Y',
  allowInput: true,
  maxDate: 'today',
  disableMobile: true,
  onChange: function () {
    validateField('birth_date');
    refreshTnc();
  },
  onClose: function () {
    validateField('birth_date');
    refreshTnc();
  },
});

// Phone + mobile cross-check: if one is filled, clear highlight from both
['phone', 'mobile'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const phone = document.getElementById('phone').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    if (phone || mobile) {
      ['phone', 'mobile'].forEach(f => {
        document.getElementById(f).classList.remove('error');
      });
      clearFieldError('phone');
    }
  });
});

// Gender — validate on change
document.querySelectorAll('input[name="gender"]').forEach(radio => {
  radio.addEventListener('change', () => {
    clearFieldError('gender');
    refreshTnc();
  });
});

// State — already has change listener above, hook refreshTnc there too
document.getElementById('state').addEventListener('change', refreshTnc);

// ── Run all client-side validations, return error map or null ─────────────────

function runClientValidation() {
  const errors = {};

  // Name
  const name = document.getElementById('name').value.trim();
  if (!name) errors.name = 'Full name is required.';
  else if (name.length > 25) errors.name = 'Name cannot exceed 25 characters.';

  // Birth date
  const rawDate = document.getElementById('birth_date').value.trim();
  if (!rawDate) {
    errors.birth_date = 'Date of birth is required.';
  } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
    errors.birth_date = 'Use DD/MM/YYYY format (e.g. 25/01/1995).';
  } else {
    const [dd, mm, yyyy] = rawDate.split('/').map(Number);
    const selected = new Date(yyyy, mm - 1, dd);
    if (selected.getDate() !== dd || selected.getMonth() !== mm - 1 || selected.getFullYear() !== yyyy) {
      errors.birth_date = 'Invalid date.';
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (selected > today) errors.birth_date = 'Date of birth cannot be in the future.';
    }
  }

  // Gender
  const gender = document.querySelector('input[name="gender"]:checked');
  if (!gender) errors.gender = 'Please select a gender.';

  // Phone / mobile
  const phone = document.getElementById('phone').value.trim();
  const mobile = document.getElementById('mobile').value.trim();
  if (!phone && !mobile) {
    errors.contact = 'At least one contact number (phone or mobile) is required.';
  } else {
    if (phone && !/^\d{10}$/.test(phone)) errors.phone = 'Phone must be exactly 10 digits.';
    if (mobile && !/^\d{10}$/.test(mobile)) errors.mobile = 'Mobile must be exactly 10 digits.';
  }

  // Email format
  const email = document.getElementById('email').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  // State
  const state = document.getElementById('state').value;
  if (!state) errors.state = 'Please select a state.';

  // Photo format
  const photoInput = document.getElementById('photo');
  if (photoInput.files[0]) {
    const ext = photoInput.files[0].name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) errors.photo = 'Photo must be JPG or PNG.';
  }

  return Object.keys(errors).length ? errors : null;
}

// ── Shared error display ──────────────────────────────────────────────────────

function showAllErrors(errs) {
  const errorBox = document.getElementById('errorBox');
  const errorList = document.getElementById('errorList');
  errorList.innerHTML = '';

  const labels = {
    name: 'Full Name', birth_date: 'Date of Birth', gender: 'Gender',
    email: 'Email', phone: 'Phone', mobile: 'Mobile', contact: 'Contact',
    state: 'State', city: 'City', photo: 'Photo', non_field_errors: 'Form',
  };

  let hasErrors = false;
  Object.entries(errs).forEach(([field, msgs]) => {
    const msg = Array.isArray(msgs) ? msgs[0] : msgs;

    // contact error → highlight both phone and mobile fields
    if (field === 'contact') {
      ['phone', 'mobile'].forEach(f => {
        const el = document.getElementById(f);
        if (el) el.classList.add('error');
      });
      const errEl = document.getElementById('err-phone');
      if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
    } else {
      setFieldError(field, msg);
    }

    const li = document.createElement('li');
    li.textContent = `${labels[field] || field}: ${msg}`;
    errorList.appendChild(li);
    hasErrors = true;
  });

  if (hasErrors) {
    errorBox.classList.add('show');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function clearErrors() {
  document.getElementById('errorBox').classList.remove('show');
  document.getElementById('errorList').innerHTML = '';
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.getElementById('tncGroup').classList.remove('error');
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function resetForm() {
  document.getElementById('registerForm').reset();
  document.getElementById('city').innerHTML = '<option value="">Select a state first</option>';
  document.getElementById('city').disabled = true;
  document.getElementById('photoPreview').classList.remove('show');
  document.getElementById('fileName').textContent = '';
  document.getElementById('photoUploadArea').classList.remove('has-file');
  clearErrors();
}

// ── Form submit ───────────────────────────────────────────────────────────────

document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearErrors();

  // 1. Client-side validation — show all errors at once, stop if any
  const clientErrors = runClientValidation();
  if (clientErrors) {
    showAllErrors(clientErrors);
    return;
  }

  // 2. T&C check
  const tnc = document.getElementById('tnc');
  if (!tnc.checked) {
    document.getElementById('tncGroup').classList.add('error');
    const errEl = document.getElementById('err-tnc');
    errEl.textContent = 'You must agree to the Terms & Conditions before registering.';
    errEl.classList.add('show');
    errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  // 3. Submit to API
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Registering…';

  const form = document.getElementById('registerForm');
  const fd = new FormData();

  fd.append('name', document.getElementById('name').value.trim());

  const rawDate = document.getElementById('birth_date').value.trim();
  if (rawDate) fd.append('birth_date', rawDate);

  const emailVal = form.email.value.trim();
  if (emailVal) fd.append('email', emailVal);
  fd.append('phone',  form.phone.value.trim());
  fd.append('mobile', form.mobile.value.trim());

  const gender = form.querySelector('input[name="gender"]:checked');
  if (gender) fd.append('gender', gender.value);

  const state = form.state.value;
  if (state) fd.append('state_id', state);

  const city = form.city.value;
  if (city) fd.append('city_id', city);

  form.querySelectorAll('input[name="hobbies_ids"]:checked').forEach(cb => {
    fd.append('hobbies_ids', cb.value);
  });

  const photoFile = form.photo.files[0];
  if (photoFile) fd.append('photo', photoFile);

  try {
    const res = await fetch('/api/register/', { method: 'POST', body: fd });

    if (res.ok) {
      window.location.href = '/users/';
      return;
    }

    const data = await res.json();
    const errs = data.errors || data;
    showAllErrors(errs);
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Register';
  }
});

loadStates();
refreshTnc();
