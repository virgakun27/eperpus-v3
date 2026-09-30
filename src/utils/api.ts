import { Book, Member, Transaction, KelasItem, SiswaItem } from '../types/library';

// Helper for unified API calls with graceful fallback
export const api = {
  // 1. Health check
  checkHealth: async () => {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch {
      return { status: 'offline', database: 'offline_or_local', configured: false };
    }
  },

  // 2. Auth login
  login: async (credentials: { username?: string; password?: string; rfidCard?: string }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login gagal.');
    }
    return await res.json();
  },

  // 3. Books
  getBooks: async (): Promise<Book[]> => {
    const res = await fetch('/api/books');
    if (!res.ok) throw new Error('Failed to fetch books');
    return await res.json();
  },

  saveBook: async (book: Book): Promise<void> => {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
    if (!res.ok) throw new Error('Failed to save book');
  },

  updateBook: async (book: Book): Promise<void> => {
    const res = await fetch(`/api/books/${book.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
    if (!res.ok) throw new Error('Failed to update book');
  },

  deleteBook: async (bookId: string): Promise<void> => {
    const res = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete book');
  },

  bulkAddBooks: async (books: Book[]): Promise<void> => {
    const res = await fetch('/api/books/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ books })
    });
    if (!res.ok) throw new Error('Failed to import books');
  },

  // 4. Classes (Kelas)
  getClasses: async (): Promise<KelasItem[]> => {
    const res = await fetch('/api/classes');
    if (!res.ok) throw new Error('Failed to fetch classes');
    return await res.json();
  },

  saveClass: async (item: KelasItem): Promise<void> => {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to save class');
  },

  updateClass: async (item: KelasItem): Promise<void> => {
    const res = await fetch(`/api/classes/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to update class');
  },

  deleteClass: async (id: string): Promise<void> => {
    const res = await fetch(`/api/classes/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete class');
  },

  // 5. Students (Siswa)
  getStudents: async (): Promise<SiswaItem[]> => {
    const res = await fetch('/api/students');
    if (!res.ok) throw new Error('Failed to fetch students');
    return await res.json();
  },

  saveStudent: async (item: SiswaItem): Promise<void> => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to save student');
  },

  deleteStudent: async (id: string): Promise<void> => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete student');
  },

  // 6. Members (Anggota)
  getMembers: async (): Promise<Member[]> => {
    const res = await fetch('/api/members');
    if (!res.ok) throw new Error('Failed to fetch members');
    return await res.json();
  },

  toggleMemberStatus: async (id: string): Promise<string> => {
    const res = await fetch(`/api/members/${id}/toggle-status`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to toggle member status');
    const data = await res.json();
    return data.status;
  },

  // 7. Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const res = await fetch('/api/transactions');
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return await res.json();
  },

  borrowBooks: async (transactions: Transaction[], memberId: string): Promise<void> => {
    const res = await fetch('/api/transactions/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, memberId })
    });
    if (!res.ok) throw new Error('Failed to process loan');
  },

  returnBook: async (payload: { transactionId: string; bookId?: string; memberId?: string; returnDate: string; fineAmount: number; notes?: string }): Promise<void> => {
    const res = await fetch('/api/transactions/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to process return');
  },

  // 8. Database Tools & Schema Management
  testDatabaseConnection: async () => {
    const res = await fetch('/api/database/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  getDatabaseStatus: async () => {
    const res = await fetch('/api/database/status');
    return await res.json();
  },

  executeDatabaseSchema: async () => {
    const res = await fetch('/api/database/execute-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  getSchemaSql: async () => {
    const res = await fetch('/api/database/schema-sql');
    return await res.json();
  }
};
