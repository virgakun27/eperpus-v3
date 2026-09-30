import { Book, Member, Transaction, KelasItem, SiswaItem } from '../types/library';

/**
 * Robust JSON fetcher that protects against HTML responses (e.g. 404, 502, proxy error "The page cannot...")
 * and avoids raw SyntaxError crashes ("Unexpected token 'T', 'The page c'... is not valid JSON").
 */
async function safeFetchJson<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const headers = new Headers(options?.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
      let errorMsg = `Server error HTTP ${res.status}`;
      if (isJson) {
        try {
          const errData = await res.json();
          errorMsg = errData.error || errData.message || errorMsg;
        } catch {
          // ignore parsing error
        }
      } else {
        const text = await res.text().catch(() => '');
        if (text.includes('The page') || text.includes('<!DOCTYPE') || text.includes('<html')) {
          errorMsg = `Layanan server (${res.status}) sedang dalam pemeliharaan atau memuat ulang.`;
        } else if (text && text.length < 200) {
          errorMsg = text.trim();
        }
      }
      throw new Error(errorMsg);
    }

    if (!isJson) {
      // The server returned 200 OK but with HTML or text (e.g. Vite SPA fallback index.html)
      if (fallback !== undefined) {
        console.warn(`[API] Expected JSON from ${url} but received ${contentType || 'non-JSON'}. Using local fallback.`);
        return fallback;
      }
      throw new Error(`Endpoint ${url} tidak mengembalikan data JSON.`);
    }

    return await res.json();
  } catch (err: any) {
    if (fallback !== undefined) {
      console.warn(`[API] Fetch warning for ${url}:`, err.message || err, '- fallback loaded.');
      return fallback;
    }
    throw err;
  }
}

export interface DatabaseStatusResponse {
  status: string;
  configured: boolean;
  connected: boolean;
  provider?: string;
  tables?: Record<string, number>;
  [key: string]: any;
}

export interface DatabaseTestResponse {
  success: boolean;
  message: string;
  databaseName?: string;
  latencyMs?: number;
  tablesFound?: string[];
  [key: string]: any;
}

// Helper for unified API calls with graceful fallback
export const api = {
  // 1. Health check
  checkHealth: async () => {
    return await safeFetchJson(
      '/api/health',
      undefined,
      { status: 'offline', database: 'offline_or_local', configured: false, provider: 'Local Fallback' }
    );
  },

  // 2. Auth login
  login: async (credentials: { username?: string; password?: string; rfidCard?: string }) => {
    return await safeFetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  },

  // 3. Books
  getBooks: async (): Promise<Book[]> => {
    return await safeFetchJson<Book[]>('/api/books', undefined, []);
  },

  saveBook: async (book: Book): Promise<void> => {
    await safeFetchJson('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
  },

  updateBook: async (book: Book): Promise<void> => {
    await safeFetchJson(`/api/books/${book.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
  },

  deleteBook: async (bookId: string): Promise<void> => {
    await safeFetchJson(`/api/books/${bookId}`, {
      method: 'DELETE'
    });
  },

  bulkAddBooks: async (books: Book[]): Promise<void> => {
    await safeFetchJson('/api/books/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ books })
    });
  },

  // 4. Classes (Kelas)
  getClasses: async (): Promise<KelasItem[]> => {
    return await safeFetchJson<KelasItem[]>('/api/classes', undefined, []);
  },

  saveClass: async (item: KelasItem): Promise<void> => {
    await safeFetchJson('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  },

  updateClass: async (item: KelasItem): Promise<void> => {
    await safeFetchJson(`/api/classes/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  },

  deleteClass: async (id: string): Promise<void> => {
    await safeFetchJson(`/api/classes/${id}`, {
      method: 'DELETE'
    });
  },

  // 5. Students (Siswa)
  getStudents: async (): Promise<SiswaItem[]> => {
    return await safeFetchJson<SiswaItem[]>('/api/students', undefined, []);
  },

  saveStudent: async (item: SiswaItem): Promise<void> => {
    await safeFetchJson('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  },

  updateStudent: async (item: SiswaItem): Promise<void> => {
    await safeFetchJson(`/api/students/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  },

  deleteStudent: async (id: string): Promise<void> => {
    await safeFetchJson(`/api/students/${id}`, {
      method: 'DELETE'
    });
  },

  // 6. Members (Anggota)
  getMembers: async (): Promise<Member[]> => {
    return await safeFetchJson<Member[]>('/api/members', undefined, []);
  },

  saveMember: async (member: Member): Promise<void> => {
    await safeFetchJson('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
  },

  updateMember: async (member: Member): Promise<void> => {
    await safeFetchJson(`/api/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
  },

  deleteMember: async (id: string): Promise<void> => {
    await safeFetchJson(`/api/members/${id}`, {
      method: 'DELETE'
    });
  },

  toggleMemberStatus: async (id: string): Promise<string> => {
    const data = await safeFetchJson<{ status: string }>(`/api/members/${id}/toggle-status`, {
      method: 'PUT'
    }, { status: 'Aktif' });
    return data.status;
  },

  // 7. Users Management
  getUsers: async (): Promise<any[]> => {
    return await safeFetchJson<any[]>('/api/users', undefined, []);
  },

  saveUser: async (user: any): Promise<void> => {
    await safeFetchJson('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  },

  updateUser: async (user: any): Promise<void> => {
    await safeFetchJson(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    await safeFetchJson(`/api/users/${id}`, {
      method: 'DELETE'
    });
  },

  // 8. Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    return await safeFetchJson<Transaction[]>('/api/transactions', undefined, []);
  },

  borrowBooks: async (transactions: Transaction[], memberId: string): Promise<void> => {
    await safeFetchJson('/api/transactions/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, memberId })
    });
  },

  returnBook: async (payload: { transactionId: string; bookId?: string; memberId?: string; returnDate: string; fineAmount: number; notes?: string }): Promise<void> => {
    await safeFetchJson('/api/transactions/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // 9. Database Tools & Schema Management
  testDatabaseConnection: async (): Promise<DatabaseTestResponse> => {
    return await safeFetchJson<DatabaseTestResponse>(
      '/api/database/test',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { success: false, message: 'Server database sedang tidak merespons.' }
    );
  },

  getDatabaseStatus: async (): Promise<DatabaseStatusResponse> => {
    return await safeFetchJson<DatabaseStatusResponse>(
      '/api/database/status',
      undefined,
      { status: 'offline', configured: false, connected: false }
    );
  },

  executeDatabaseSchema: async (): Promise<{ success: boolean; message: string; [key: string]: any }> => {
    return await safeFetchJson<{ success: boolean; message: string; [key: string]: any }>(
      '/api/database/execute-schema',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { success: false, message: 'Gagal menjalankan migrasi skema database.' }
    );
  },

  getSchemaSql: async (): Promise<{ sql: string; [key: string]: any }> => {
    return await safeFetchJson<{ sql: string; [key: string]: any }>(
      '/api/database/schema-sql',
      undefined,
      { sql: '' }
    );
  },

  // 10. Security Token Verification (Server-side DB lookup)
  verifySecurityToken: async (tokenKey: string, token: string): Promise<{ success: boolean; tokenSessionId?: string; error?: string }> => {
    return await safeFetchJson<{ success: boolean; tokenSessionId?: string; error?: string }>(
      '/api/auth/verify-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenKey, token })
      },
      { success: false, error: 'Gagal menghubungi server untuk memvalidasi token.' }
    );
  }
};
