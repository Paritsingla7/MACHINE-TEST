// Shared auth utilities — include before any page script that needs authentication.

const AUTH = (() => {
  const K = {
    access:   'mt_access',
    refresh:  'mt_refresh',
    username: 'mt_username',
    isAdmin:  'mt_is_admin',
  };

  return {
    getAccess()   { return localStorage.getItem(K.access);   },
    getRefresh()  { return localStorage.getItem(K.refresh);  },
    getUsername() { return localStorage.getItem(K.username); },
    isAdmin()     { return localStorage.getItem(K.isAdmin) === 'true'; },

    store({ access, refresh, username, is_admin } = {}) {
      if (access    != null) localStorage.setItem(K.access,   access);
      if (refresh   != null) localStorage.setItem(K.refresh,  refresh);
      if (username  != null) localStorage.setItem(K.username, username);
      if (is_admin  != null) localStorage.setItem(K.isAdmin,  String(is_admin));
    },

    clear() {
      Object.values(K).forEach(k => localStorage.removeItem(k));
    },

    logout() {
      this.clear();
      window.location.href = '/login/';
    },

    async tryRefresh() {
      const refresh = this.getRefresh();
      if (!refresh) return null;
      try {
        const res = await fetch('/api/token/refresh/', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        localStorage.setItem(K.access, data.access);
        return data.access;
      } catch {
        return null;
      }
    },

    // Drop-in replacement for fetch() that attaches Bearer token and auto-refreshes on 401.
    async fetch(url, options = {}) {
      let token = this.getAccess();
      if (!token) { this.logout(); return null; }

      const withBearer = t => ({ ...(options.headers || {}), 'Authorization': `Bearer ${t}` });

      let res = await fetch(url, { ...options, headers: withBearer(token) });

      if (res.status === 401) {
        token = await this.tryRefresh();
        if (!token) { this.logout(); return null; }
        res = await fetch(url, { ...options, headers: withBearer(token) });
        if (res.status === 401) { this.logout(); return null; }
      }

      return res;
    },

    // Call at the top of every page that requires login.
    requireAuth() {
      if (!this.getAccess()) {
        window.location.href = '/login/';
        return false;
      }
      return true;
    },

    // Call at the top of admin-only pages.
    requireAdmin() {
      if (!this.requireAuth()) return false;
      if (!this.isAdmin()) {
        window.location.href = '/profile/';
        return false;
      }
      return true;
    },
  };
})();
