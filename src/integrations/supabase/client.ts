// Supabase compatibility shim that talks to a local Flask API.
// This preserves the same method surface used in this app so we don't touch any UI.
// Set FLASK_API_URL in localStorage to override the default.

// Minimal internal session cache to drive onAuthStateChange
let __currentSession: any = null;
const API_BASE = (typeof window !== 'undefined' && (localStorage.getItem('FLASK_API_URL') || 'http://localhost:5000')) || 'http://localhost:5000';

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`.replace(/\/+$/, ''), {
    credentials: 'include',
    headers: {
      ...(opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(opts.headers || {}),
    },
    ...opts,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    return { error: data || res.statusText, data: null };
  }
  return { data, error: null };
}

function makeQueryBuilder(table: string) {
  let _filters: Record<string, any> = {};
  let _order: { column: string; ascending: boolean } | null = null;
  let _range: { from: number; to: number } | null = null;
  let _limit: number | null = null;
  let _select = '*';
  let _insertPayload: any = null;
  let _updatePayload: any = null;
  let _selectColumns: string | null = null;

  const buildQuery = () => {
    const params = new URLSearchParams();
    Object.entries(_filters).forEach(([k, v]) => params.append(`eq.${k}`, String(v)));
    if (_order) params.append('order', `${_order.column}.${_order.ascending ? 'asc' : 'desc'}`);
    if (_range) {
      params.append('from', String(_range.from));
      params.append('to', String(_range.to));
    } else if (_limit != null) {
      params.append('from', '0');
      params.append('to', String(Math.max(0, _limit - 1)));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const executeOperation = async () => {
    if (_insertPayload) {
      // For inserts, Flask backend always returns the created data
      const result = await api(`/db/${table}`, { method: 'POST', body: JSON.stringify(_insertPayload) });
      return result;
    } else if (_updatePayload) {
      const qs = buildQuery();
      return api(`/db/${table}${qs}`, { method: 'PATCH', body: JSON.stringify(_updatePayload) });
    } else {
      return api(`/db/${table}${buildQuery()}`);
    }
  };

  // Build a thenable query object similar to Supabase's PostgREST client
  const builder: any = {
    select(columns?: string) {
      _selectColumns = columns || '*';
      return builder;
    },
    insert(payload: any) {
      _insertPayload = payload;
      return builder; // Return builder to allow chaining
    },
    update(payload: any) {
      _updatePayload = payload;
      return {
        eq: (column: string, value: any) => {
          _filters[column] = value;
          return builder;
        }
      };
    },
    delete() {
      return {
        eq: async (column: string, value: any) => {
          const qs = new URLSearchParams({ [`eq.${column}`]: String(value) }).toString();
          return api(`/db/${table}?${qs}`, { method: 'DELETE' });
        },
      };
    },
    order(column: string, opts?: { ascending?: boolean }) {
      _order = { column, ascending: opts?.ascending ?? false };
      return builder;
    },
    range(from: number, to: number) {
      _range = { from, to };
      return builder;
    },
    limit(count: number) {
      _limit = count;
      return builder;
    },
    eq(column: string, value: any) {
      _filters[column] = value;
      return builder;
    },
    async single() {
      const res: any = await executeOperation();
      if (res.error) return res;
      if (Array.isArray(res.data)) {
        return { data: res.data[0] ?? null, error: null };
      }
      return res;
    },
    async maybeSingle() {
      const res: any = await executeOperation();
      if (res.error) return res;
      if (Array.isArray(res.data)) {
        return { data: res.data[0] ?? null, error: null };
      }
      return res;
    },
    then(onFulfilled: any, onRejected: any) {
      return executeOperation().then(onFulfilled, onRejected);
    },
  };

  return builder;
}

export const supabase: any = {
  auth: {
    async getUser() {
      const { data, error } = await api('/auth/session');
      return { data: { user: data?.user ?? null }, error };
    },
    async getSession() {
      const { data, error } = await api('/auth/session');
      const session = data?.user ? { user: data.user } : null;
      __currentSession = session;
      return { data: { session }, error };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      // Poll-based listener suitable for offline/local network
      let last = JSON.stringify(__currentSession || null);
      const timer = setInterval(async () => {
        const { data } = await api('/auth/session');
        const next = data?.user ? { user: data.user } : null;
        const nextStr = JSON.stringify(next);
        if (nextStr !== last) {
          last = nextStr;
          __currentSession = next;
          callback(next ? 'SIGNED_IN' : 'SIGNED_OUT', next);
        }
      }, 1500);
      return { data: { subscription: { unsubscribe: () => clearInterval(timer) } } } as any;
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const res = await api('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (!res.error) __currentSession = { user: res.data.user };
      return res.error ? { data: null, error: res.error } : { data: { user: res.data.user }, error: null };
    },
    async signUp({ email, password }: { email: string; password: string }) {
      const res = await api('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
      return res.error ? { data: null, error: res.error } : { data: { user: res.data.user }, error: null };
    },
    async signOut() {
      const res = await api('/auth/signout', { method: 'POST' });
      __currentSession = null;
      return res.error ? { error: res.error } : { error: null };
    },
    async updateUser(payload: any) {
      const res = await api('/auth/update_user', { method: 'POST', body: JSON.stringify(payload) });
      return res.error ? { data: null, error: res.error } : { data: res.data, error: null };
    },
  },
  from(table: string) {
    return makeQueryBuilder(table);
  },
  functions: {
    async invoke(name: string, { body }: { body?: any } = {}) {
      const res = await api(`/functions/${name}`, { method: 'POST', body: JSON.stringify(body || {}) });
      return res.error ? { data: null, error: res.error } : { data: res.data, error: null };
    },
  },
  rpc: async (fn: string, params?: any) => {
    const res = await api(`/rpc/${fn}`, { method: 'POST', body: JSON.stringify(params || {}) });
    return res.error ? { data: null, error: res.error } : { data: res.data, error: null };
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File | Blob) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('path', path);
          return api(`/storage/${bucket}/upload`, { method: 'POST', body: fd });
        },
        getPublicUrl(path: string) {
          // Return a URL served by Flask static handler
          const url = `${API_BASE}/storage/${bucket}/public/${encodeURIComponent(path)}`;
          return { data: { publicUrl: url } };
        },
      };
    },
  },
};

export type { };
