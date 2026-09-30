import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getSupabase, isSupabaseConfigured, testSupabasePing, seedSupabaseData, SUPABASE_URL } from './src/db/supabase.js';
import { getDb, isDatabaseConfigured } from './src/db/neon.js';
import { initializeNeonDatabase } from './src/db/migrate.js';
import { hashPassword, verifyPassword } from './src/utils/password.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Supabase & Database Startup Diagnostics
  if (isSupabaseConfigured) {
    console.log('[Server] Supabase configured with URL:', SUPABASE_URL);
    testSupabasePing().then(res => {
      console.log('[Server] Supabase Ping Status:', res.message);
    }).catch(err => {
      console.warn('[Server] Supabase Ping Notice:', err.message);
    });
  } else if (isDatabaseConfigured) {
    initializeNeonDatabase().catch(err => {
      console.error('[Server] Neon initialization error:', err);
    });
  }

  // ============================================================================
  // 1. HEALTH & DATABASE DIAGNOSTIC ENDPOINTS
  // ============================================================================

  // 1a. Health Check Endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      if (isSupabaseConfigured) {
        const ping = await testSupabasePing();
        return res.json({
          status: ping.success ? 'ok' : 'standby',
          database: ping.success ? 'connected' : 'connecting',
          provider: 'Supabase PostgreSQL',
          configured: true,
          projectRef: ping.projectRef,
          latencyMs: ping.latencyMs,
          message: ping.message,
          serverTime: new Date().toISOString()
        });
      }

      if (isDatabaseConfigured) {
        const sql = getDb();
        if (sql) {
          const dbCheck = await sql`SELECT 1 as connected, NOW() as server_time;`;
          return res.json({
            status: 'ok',
            database: 'connected',
            provider: 'PostgreSQL Serverless',
            configured: true,
            serverTime: dbCheck[0]?.server_time || new Date().toISOString()
          });
        }
      }

      return res.json({
        status: 'ok',
        database: 'offline_or_local',
        configured: false,
        message: 'Database belum aktif. Berjalan dalam mode penyimpanan lokal (LocalStorage).',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Health Check Failed:', error);
      return res.status(500).json({
        status: 'error',
        database: 'error',
        message: error.message || 'Gagal memeriksa koneksi database.'
      });
    }
  });

  // 1b. Test Database Connection with Latency
  app.post('/api/database/test', async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      if (isSupabaseConfigured) {
        const ping = await testSupabasePing();
        return res.json({
          success: ping.success,
          configured: true,
          provider: 'Supabase PostgreSQL',
          message: ping.message,
          databaseName: ping.projectRef || 'Supabase',
          postgresVersion: 'PostgreSQL 15 (Supabase Cloud)',
          serverTime: new Date().toISOString(),
          latencyMs: ping.latencyMs,
          tablesFound: ping.tablesFound
        });
      }

      if (isDatabaseConfigured) {
        const sql = getDb();
        if (sql) {
          const result = await sql`SELECT 1 as connected, version(), current_database() as db_name, NOW() as server_time;`;
          const latencyMs = Date.now() - startTime;
          return res.json({
            success: true,
            configured: true,
            provider: 'Neon Serverless PostgreSQL',
            message: 'Koneksi ke PostgreSQL berhasil tersambung!',
            databaseName: result[0]?.db_name || 'neondb',
            postgresVersion: result[0]?.version || 'PostgreSQL',
            serverTime: result[0]?.server_time || new Date().toISOString(),
            latencyMs
          });
        }
      }

      return res.json({
        success: false,
        configured: false,
        message: 'Supabase URL atau DATABASE_URL belum dikonfigurasi di file .env. Sistem berjalan dalam mode LocalStorage.',
        latencyMs: 0
      });
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      console.error('Database Test Connection Failed:', error);
      return res.status(500).json({
        success: false,
        configured: isSupabaseConfigured || isDatabaseConfigured,
        message: error.message || 'Gagal terhubung ke database. Periksa kredensial di .env.',
        latencyMs
      });
    }
  });

  // 1c. Get Detailed Database Table Metrics & Status
  app.get('/api/database/status', async (req: Request, res: Response) => {
    try {
      if (isSupabaseConfigured) {
        const client = getSupabase();
        if (client) {
          const [booksRes, membersRes, studentsRes, classesRes, txRes, usersRes] = await Promise.all([
            client.from('books').select('*', { count: 'exact', head: true }),
            client.from('members').select('*', { count: 'exact', head: true }),
            client.from('students').select('*', { count: 'exact', head: true }),
            client.from('classes').select('*', { count: 'exact', head: true }),
            client.from('transactions').select('*', { count: 'exact', head: true }),
            client.from('users').select('*', { count: 'exact', head: true })
          ]);

          return res.json({
            configured: true,
            connected: true,
            provider: 'Supabase PostgreSQL',
            tables: {
              classes: classesRes.count ?? 0,
              students: studentsRes.count ?? 0,
              members: membersRes.count ?? 0,
              books: booksRes.count ?? 0,
              transactions: txRes.count ?? 0,
              users: usersRes.count ?? 0
            },
            checkedAt: new Date().toISOString()
          });
        }
      }

      if (isDatabaseConfigured) {
        const sql = getDb();
        if (sql) {
          const [booksCount, membersCount, studentsCount, classesCount, transactionsCount, usersCount] = await Promise.all([
            sql`SELECT count(*)::int as count FROM books;`.catch(() => [{ count: 0 }]),
            sql`SELECT count(*)::int as count FROM members;`.catch(() => [{ count: 0 }]),
            sql`SELECT count(*)::int as count FROM students;`.catch(() => [{ count: 0 }]),
            sql`SELECT count(*)::int as count FROM classes;`.catch(() => [{ count: 0 }]),
            sql`SELECT count(*)::int as count FROM transactions;`.catch(() => [{ count: 0 }]),
            sql`SELECT count(*)::int as count FROM users;`.catch(() => [{ count: 0 }])
          ]);

          return res.json({
            configured: true,
            connected: true,
            provider: 'Neon Serverless PostgreSQL',
            tables: {
              classes: classesCount[0]?.count || 0,
              students: studentsCount[0]?.count || 0,
              members: membersCount[0]?.count || 0,
              books: booksCount[0]?.count || 0,
              transactions: transactionsCount[0]?.count || 0,
              users: usersCount[0]?.count || 0
            },
            checkedAt: new Date().toISOString()
          });
        }
      }

      return res.json({
        configured: false,
        connected: false,
        tables: {
          classes: 0,
          students: 0,
          members: 0,
          books: 0,
          transactions: 0,
          users: 0
        },
        message: 'Kredensial database belum aktif.'
      });
    } catch (error: any) {
      console.error('Failed to get database table status:', error);
      return res.status(500).json({ configured: false, connected: false, error: error.message });
    }
  });

  // 1d. Execute Schema / Seed Migration
  app.post('/api/database/execute-schema', async (req: Request, res: Response) => {
    try {
      if (isSupabaseConfigured) {
        const seedRes = await seedSupabaseData();
        return res.json({
          success: seedRes.success,
          message: seedRes.message,
          provider: 'Supabase PostgreSQL',
          results: seedRes.results
        });
      }

      if (isDatabaseConfigured) {
        const result = await initializeNeonDatabase();
        return res.json({
          success: result.success,
          message: result.success 
            ? 'Tabel, constraints, index, dan initial seed berhasil diterapkan ke PostgreSQL!'
            : 'Eksekusi schema gagal.',
          provider: 'PostgreSQL'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Koneksi database (Supabase / PostgreSQL) belum dikonfigurasi di file .env.'
      });
    } catch (error: any) {
      console.error('Error executing schema migration:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menjalankan script schema.',
        error: error.message
      });
    }
  });

  // 1e. Get Schema SQL content
  app.get('/api/database/schema-sql', (req: Request, res: Response) => {
    try {
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const content = fs.readFileSync(schemaPath, 'utf8');
        return res.json({ success: true, sql: content });
      }
      return res.status(404).json({ success: false, message: 'File schema.sql tidak ditemukan.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================================================
  // 2. AUTHENTICATION & LOGIN (DENGAN BCRYPT PASSWORD HASHING)
  // ============================================================================
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password, rfidCard } = req.body;
    const client = getSupabase();
    const sql = getDb();

    try {
      // 1. Login with RFID Card
      if (rfidCard) {
        if (client) {
          // Check users table in Supabase
          const { data: usersByRfid } = await client.from('users').select('*').eq('rfid_card', rfidCard).limit(1);
          if (usersByRfid && usersByRfid.length > 0) {
            const u = usersByRfid[0];
            return res.json({
              id: u.id,
              name: u.name,
              username: u.username,
              role: u.role,
              email: u.email,
              status: u.status
            });
          }

          // Check students table in Supabase
          const { data: stdByRfid } = await client.from('students').select('*').eq('rfid_card', rfidCard).limit(1);
          if (stdByRfid && stdByRfid.length > 0) {
            const s = stdByRfid[0];
            return res.json({
              id: s.id,
              name: s.name,
              username: s.username,
              role: 'Siswa',
              email: s.email,
              status: s.status
            });
          }
        } else if (sql) {
          const userByRfid = await sql`SELECT * FROM users WHERE rfid_card = ${rfidCard} LIMIT 1;`;
          if (userByRfid.length > 0) {
            const u = userByRfid[0];
            return res.json({
              id: u.id,
              name: u.name,
              username: u.username,
              role: u.role,
              email: u.email,
              status: u.status
            });
          }

          const studentByRfid = await sql`SELECT * FROM students WHERE rfid_card = ${rfidCard} LIMIT 1;`;
          if (studentByRfid.length > 0) {
            const s = studentByRfid[0];
            return res.json({
              id: s.id,
              name: s.name,
              username: s.username,
              role: 'Siswa',
              email: s.email,
              status: s.status
            });
          }
        }

        return res.status(404).json({ error: 'Kartu RFID tidak terdaftar di sistem.' });
      }

      // 2. Login with Username & Password (BCRYPT VERIFICATION)
      if (client) {
        // Check in Supabase 'users' table
        const { data: userRows } = await client.from('users').select('*').eq('username', username).limit(1);
        if (userRows && userRows.length > 0) {
          const u = userRows[0];
          const isMatch = verifyPassword(password, u.password_hash);
          if (isMatch) {
            return res.json({
              id: u.id,
              name: u.name,
              username: u.username,
              role: u.role,
              email: u.email,
              status: u.status
            });
          }
        }

        // Check in Supabase 'students' table
        const { data: studentRows } = await client.from('students').select('*').eq('username', username).limit(1);
        if (studentRows && studentRows.length > 0) {
          const s = studentRows[0];
          const isMatch = verifyPassword(password, s.password_hash);
          if (isMatch) {
            return res.json({
              id: s.id,
              name: s.name,
              username: s.username,
              role: 'Siswa',
              email: s.email,
              status: s.status
            });
          }
        }
      } else if (sql) {
        const userRes = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1;`;
        if (userRes.length > 0) {
          const u = userRes[0];
          if (verifyPassword(password, u.password_hash)) {
            return res.json({
              id: u.id,
              name: u.name,
              username: u.username,
              role: u.role,
              email: u.email,
              status: u.status
            });
          }
        }

        const studentRes = await sql`SELECT * FROM students WHERE username = ${username} LIMIT 1;`;
        if (studentRes.length > 0) {
          const s = studentRes[0];
          if (verifyPassword(password, s.password_hash)) {
            return res.json({
              id: s.id,
              name: s.name,
              username: s.username,
              role: 'Siswa',
              email: s.email,
              status: s.status
            });
          }
        }
      }

      // Hardcoded fallback for default accounts if database not yet initialized
      const defaults = [
        { u: 'admin.super', p: 'admin123', name: 'Admin Perpus', role: 'Admin', email: 'admin@sman1lumbung.sch.id' },
        { u: 'dewi.pustaka', p: 'admin123', name: 'Dewi Lestari, S.Pd.', role: 'Guru', email: 'dewi@sman1lumbung.sch.id' },
        { u: 'guru', p: 'guru123', name: 'Drs. H. Mulyana, M.Pd.', role: 'Guru', email: 'mulyana@sman1lumbung.sch.id' },
        { u: 'kepsek', p: 'kepsek123', name: 'Dr. H. Suherman, M.Pd.', role: 'Kepsek', email: 'kepsek@sman1lumbung.sch.id' },
        { u: 'siswa', p: 'siswa123', name: 'Budi Santoso', role: 'Siswa', email: 'budi@sman1lumbung.sch.id' }
      ];

      const matchedDefault = defaults.find(d => d.u === username && d.p === password);
      if (matchedDefault) {
        return res.json({
          id: 'SYS_' + matchedDefault.u,
          name: matchedDefault.name,
          username: matchedDefault.u,
          role: matchedDefault.role,
          email: matchedDefault.email,
          status: 'Aktif'
        });
      }

      return res.status(401).json({ error: 'Username atau Password tidak sesuai!' });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan saat memproses login.' });
    }
  });

  // ============================================================================
  // 3. BOOKS CRUD ENDPOINTS
  // ============================================================================
  app.get('/api/books', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();

    try {
      if (client) {
        const { data: rows, error } = await client.from('books').select('*').order('id', { ascending: true });
        if (!error && rows) {
          const formatted = rows.map((b: any) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            category: b.category,
            isbn: b.isbn,
            status: b.status,
            stock: b.stock,
            availableStock: b.available_stock,
            location: b.location,
            coverColor: b.cover_color,
            description: b.description,
            publishYear: b.publish_year
          }));
          return res.json(formatted);
        }
      }

      if (sql) {
        const rows = await sql`SELECT * FROM books ORDER BY id ASC;`;
        const formatted = rows.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          isbn: b.isbn,
          status: b.status,
          stock: b.stock,
          availableStock: b.available_stock,
          location: b.location,
          coverColor: b.cover_color,
          description: b.description,
          publishYear: b.publish_year
        }));
        return res.json(formatted);
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch books from database' });
    }
  });

  app.post('/api/books', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const b = req.body;

    const payload = {
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      isbn: b.isbn,
      status: b.status || 'Tersedia',
      stock: b.stock || 1,
      available_stock: b.availableStock ?? b.stock ?? 1,
      location: b.location || 'Rak Utama',
      cover_color: b.coverColor || 'bg-amber-100 text-amber-900 border-amber-300',
      description: b.description || '',
      publish_year: b.publishYear || 2024,
      updated_at: new Date().toISOString()
    };

    try {
      if (client) {
        const { error } = await client.from('books').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
        return res.json({ success: true, message: 'Book saved successfully' });
      }

      if (sql) {
        await sql`
          INSERT INTO books (id, title, author, category, isbn, status, stock, available_stock, location, cover_color, description, publish_year)
          VALUES (${payload.id}, ${payload.title}, ${payload.author}, ${payload.category}, ${payload.isbn}, ${payload.status}, ${payload.stock}, ${payload.available_stock}, ${payload.location}, ${payload.cover_color}, ${payload.description}, ${payload.publish_year})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            author = EXCLUDED.author,
            category = EXCLUDED.category,
            isbn = EXCLUDED.isbn,
            stock = EXCLUDED.stock,
            available_stock = EXCLUDED.available_stock,
            location = EXCLUDED.location,
            publish_year = EXCLUDED.publish_year;
        `;
        return res.json({ success: true, message: 'Book saved successfully' });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      console.error('Error inserting book:', error);
      res.status(500).json({ error: error.message || 'Failed to save book' });
    }
  });

  app.put('/api/books/:id', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { id } = req.params;
    const b = req.body;

    try {
      if (client) {
        const { error } = await client.from('books').update({
          title: b.title,
          author: b.author,
          category: b.category,
          isbn: b.isbn,
          status: b.status,
          stock: b.stock,
          available_stock: b.availableStock,
          location: b.location,
          cover_color: b.coverColor,
          description: b.description,
          publish_year: b.publishYear,
          updated_at: new Date().toISOString()
        }).eq('id', id);

        if (error) throw error;
        return res.json({ success: true, message: 'Book updated successfully' });
      }

      if (sql) {
        await sql`
          UPDATE books SET
            title = ${b.title},
            author = ${b.author},
            category = ${b.category},
            isbn = ${b.isbn},
            status = ${b.status},
            stock = ${b.stock},
            available_stock = ${b.availableStock},
            location = ${b.location},
            cover_color = ${b.coverColor},
            description = ${b.description},
            publish_year = ${b.publishYear},
            updated_at = NOW()
          WHERE id = ${id};
        `;
        return res.json({ success: true, message: 'Book updated successfully' });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update book' });
    }
  });

  app.delete('/api/books/:id', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { id } = req.params;

    try {
      if (client) {
        const { error } = await client.from('books').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      }
      if (sql) {
        await sql`DELETE FROM books WHERE id = ${id};`;
        return res.json({ success: true });
      }
      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete book' });
    }
  });

  // Bulk Books Import
  app.post('/api/books/bulk', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { books: bulkBooks } = req.body;
    if (!Array.isArray(bulkBooks)) return res.status(400).json({ error: 'Invalid payload' });

    try {
      if (client) {
        const items = bulkBooks.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          isbn: b.isbn,
          status: 'Tersedia',
          stock: b.stock || 1,
          available_stock: b.stock || 1,
          location: b.location || 'Rak Utama',
          cover_color: b.coverColor || 'bg-teal-900 text-teal-50 border-teal-950',
          description: b.description || '',
          publish_year: b.publishYear || 2024
        }));
        const { error } = await client.from('books').upsert(items, { onConflict: 'id' });
        if (error) throw error;
        return res.json({ success: true, count: items.length });
      }

      if (sql) {
        for (const b of bulkBooks) {
          await sql`
            INSERT INTO books (id, title, author, category, isbn, status, stock, available_stock, location, cover_color, description, publish_year)
            VALUES (${b.id}, ${b.title}, ${b.author}, ${b.category}, ${b.isbn}, 'Tersedia', ${b.stock || 1}, ${b.stock || 1}, ${b.location || 'Rak Utama'}, ${b.coverColor || 'bg-teal-900 text-teal-50 border-teal-950'}, ${b.description || ''}, ${b.publishYear || 2024})
            ON CONFLICT (id) DO NOTHING;
          `;
        }
        return res.json({ success: true, count: bulkBooks.length });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Bulk import failed' });
    }
  });

  // ============================================================================
  // 4. CLASSES (KELAS) CRUD
  // ============================================================================
  app.get('/api/classes', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    try {
      if (client) {
        const { data: rows, error } = await client.from('classes').select('*').order('name', { ascending: true });
        if (!error && rows) {
          const formatted = rows.map((c: any) => ({
            id: c.id,
            name: c.name,
            gradeLevel: c.grade_level,
            academicYear: c.academic_year,
            homeroomTeacher: c.homeroom_teacher,
            studentCount: c.student_count
          }));
          return res.json(formatted);
        }
      }

      if (sql) {
        const rows = await sql`SELECT * FROM classes ORDER BY name ASC;`;
        const formatted = rows.map((c: any) => ({
          id: c.id,
          name: c.name,
          gradeLevel: c.grade_level,
          academicYear: c.academic_year,
          homeroomTeacher: c.homeroom_teacher,
          studentCount: c.student_count
        }));
        return res.json(formatted);
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  });

  app.post('/api/classes', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const k = req.body;

    const payload = {
      id: k.id,
      name: k.name,
      grade_level: k.gradeLevel,
      academic_year: k.academicYear || '2025/2026',
      homeroom_teacher: k.homeroomTeacher,
      student_count: k.studentCount || 0,
      updated_at: new Date().toISOString()
    };

    try {
      if (client) {
        const { error } = await client.from('classes').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
        return res.json({ success: true });
      }

      if (sql) {
        await sql`
          INSERT INTO classes (id, name, grade_level, academic_year, homeroom_teacher, student_count)
          VALUES (${k.id}, ${k.name}, ${k.gradeLevel}, ${k.academicYear || '2025/2026'}, ${k.homeroomTeacher}, ${k.studentCount || 0})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            grade_level = EXCLUDED.grade_level,
            academic_year = EXCLUDED.academic_year,
            homeroom_teacher = EXCLUDED.homeroom_teacher;
        `;
        return res.json({ success: true });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to save class' });
    }
  });

  app.put('/api/classes/:id', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { id } = req.params;
    const k = req.body;

    try {
      if (client) {
        const { error } = await client.from('classes').update({
          name: k.name,
          grade_level: k.gradeLevel,
          academic_year: k.academicYear,
          homeroom_teacher: k.homeroomTeacher,
          updated_at: new Date().toISOString()
        }).eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      }

      if (sql) {
        await sql`
          UPDATE classes SET
            name = ${k.name},
            grade_level = ${k.gradeLevel},
            academic_year = ${k.academicYear},
            homeroom_teacher = ${k.homeroomTeacher},
            updated_at = NOW()
          WHERE id = ${id};
        `;
        return res.json({ success: true });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update class' });
    }
  });

  app.delete('/api/classes/:id', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { id } = req.params;

    try {
      if (client) {
        const { error } = await client.from('classes').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      }
      if (sql) {
        await sql`DELETE FROM classes WHERE id = ${id};`;
        return res.json({ success: true });
      }
      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete class' });
    }
  });

  // ============================================================================
  // 5. STUDENTS (SISWA) CRUD (DENGAN BCRYPT PASSWORD HASHING)
  // ============================================================================
  app.get('/api/students', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();

    try {
      if (client) {
        const { data: rows, error } = await client.from('students').select('*').order('id', { ascending: true });
        if (!error && rows) {
          const formatted = rows.map((s: any) => ({
            id: s.id,
            nis: s.nis,
            nisn: s.nisn,
            name: s.name,
            gender: s.gender,
            kelasId: s.class_id,
            kelasName: s.class_name,
            rfidCard: s.rfid_card,
            email: s.email,
            phone: s.phone,
            username: s.username,
            password: s.password_hash,
            status: s.status,
            createdAt: s.created_at
          }));
          return res.json(formatted);
        }
      }

      if (sql) {
        const rows = await sql`SELECT * FROM students ORDER BY id ASC;`;
        const formatted = rows.map((s: any) => ({
          id: s.id,
          nis: s.nis,
          nisn: s.nisn,
          name: s.name,
          gender: s.gender,
          kelasId: s.class_id,
          kelasName: s.class_name,
          rfidCard: s.rfid_card,
          email: s.email,
          phone: s.phone,
          username: s.username,
          password: s.password_hash,
          status: s.status,
          createdAt: s.created_at
        }));
        return res.json(formatted);
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  app.post('/api/students', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const s = req.body;

    // Pastikan password di-hash dengan bcrypt!
    const hashedPassword = hashPassword(s.password || 'siswa123');

    const studentPayload = {
      id: s.id,
      nis: s.nis,
      nisn: s.nisn || null,
      name: s.name,
      gender: s.gender || 'L',
      class_id: s.kelasId || null,
      class_name: s.kelasName || '',
      rfid_card: s.rfidCard,
      email: s.email || '',
      phone: s.phone || '',
      username: s.username,
      password_hash: hashedPassword,
      status: s.status || 'Aktif',
      updated_at: new Date().toISOString()
    };

    const memberPayload = {
      id: 'M_' + s.id,
      name: s.name,
      status: s.status || 'Aktif',
      rfid_card: s.rfidCard,
      type: 'Siswa',
      email: s.email || `${s.username}@sman1lumbung.sch.id`,
      phone: s.phone || '',
      max_books: 3,
      active_loans_count: 0,
      student_id: s.id,
      updated_at: new Date().toISOString()
    };

    try {
      if (client) {
        const { error: stdErr } = await client.from('students').upsert(studentPayload, { onConflict: 'id' });
        if (stdErr) throw stdErr;

        await client.from('members').upsert(memberPayload, { onConflict: 'id' });
        return res.json({ success: true });
      }

      if (sql) {
        await sql`
          INSERT INTO students (id, nis, nisn, name, gender, class_id, class_name, rfid_card, email, phone, username, password_hash, status)
          VALUES (${s.id}, ${s.nis}, ${s.nisn || null}, ${s.name}, ${s.gender || 'L'}, ${s.kelasId || null}, ${s.kelasName || ''}, ${s.rfidCard}, ${s.email || ''}, ${s.phone || ''}, ${s.username}, ${hashedPassword}, ${s.status || 'Aktif'})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            class_id = EXCLUDED.class_id,
            class_name = EXCLUDED.class_name,
            rfid_card = EXCLUDED.rfid_card,
            phone = EXCLUDED.phone,
            password_hash = EXCLUDED.password_hash,
            status = EXCLUDED.status;
        `;

        await sql`
          INSERT INTO members (id, name, status, rfid_card, type, email, phone, max_books, active_loans_count, student_id)
          VALUES (${'M_' + s.id}, ${s.name}, ${s.status || 'Aktif'}, ${s.rfidCard}, 'Siswa', ${s.email || `${s.username}@sman1lumbung.sch.id`}, ${s.phone || ''}, 3, 0, ${s.id})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            rfid_card = EXCLUDED.rfid_card,
            status = EXCLUDED.status;
        `;
        return res.json({ success: true });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      console.error('Save student error:', error);
      res.status(500).json({ error: error.message || 'Failed to save student' });
    }
  });

  app.delete('/api/students/:id', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { id } = req.params;

    try {
      if (client) {
        await client.from('members').delete().or(`student_id.eq.${id},id.eq.M_${id}`);
        const { error } = await client.from('students').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      }

      if (sql) {
        await sql`DELETE FROM students WHERE id = ${id};`;
        await sql`DELETE FROM members WHERE student_id = ${id} OR id = ${'M_' + id};`;
        return res.json({ success: true });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  // ============================================================================
  // 6. MEMBERS (ANGGOTA) CRUD
  // ============================================================================
  app.get('/api/members', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();

    try {
      if (client) {
        const { data: rows, error } = await client.from('members').select('*').order('id', { ascending: true });
        if (!error && rows) {
          const formatted = rows.map((m: any) => ({
            id: m.id,
            name: m.name,
            status: m.status,
            rfidCard: m.rfid_card,
            type: m.type,
            email: m.email,
            phone: m.phone,
            maxBooks: m.max_books,
            activeLoansCount: m.active_loans_count
          }));
          return res.json(formatted);
        }
      }

      if (sql) {
        const rows = await sql`SELECT * FROM members ORDER BY id ASC;`;
        const formatted = rows.map((m: any) => ({
          id: m.id,
          name: m.name,
          status: m.status,
          rfidCard: m.rfid_card,
          type: m.type,
          email: m.email,
          phone: m.phone,
          maxBooks: m.max_books,
          activeLoansCount: m.active_loans_count
        }));
        return res.json(formatted);
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  });

  app.put('/api/members/:id/toggle-status', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { id } = req.params;

    try {
      if (client) {
        const { data: curRows } = await client.from('members').select('status').eq('id', id).limit(1);
        if (!curRows || curRows.length === 0) return res.status(404).json({ error: 'Member not found' });
        const nextStatus = curRows[0].status === 'Aktif' ? 'Ditangguhkan' : 'Aktif';
        await client.from('members').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', id);
        return res.json({ success: true, status: nextStatus });
      }

      if (sql) {
        const current = await sql`SELECT status FROM members WHERE id = ${id} LIMIT 1;`;
        if (current.length === 0) return res.status(404).json({ error: 'Member not found' });
        const nextStatus = current[0].status === 'Aktif' ? 'Ditangguhkan' : 'Aktif';
        await sql`UPDATE members SET status = ${nextStatus}, updated_at = NOW() WHERE id = ${id};`;
        return res.json({ success: true, status: nextStatus });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to toggle member status' });
    }
  });

  // ============================================================================
  // 7. TRANSACTIONS (SIRKULASI PEMINJAMAN & PENGEMBALIAN)
  // ============================================================================
  app.get('/api/transactions', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();

    try {
      if (client) {
        const { data: rows, error } = await client.from('transactions').select('*').order('created_at', { ascending: false });
        if (!error && rows) {
          const formatted = rows.map((t: any) => ({
            id: t.id,
            bookId: t.book_id,
            bookTitle: t.book_title,
            memberId: t.member_id,
            memberName: t.member_name,
            borrowDate: t.borrow_date ? new Date(t.borrow_date).toISOString().split('T')[0] : '',
            dueDate: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : '',
            returnDate: t.return_date ? new Date(t.return_date).toISOString().split('T')[0] : null,
            status: t.status,
            fineAmount: parseFloat(t.fine_amount) || 0,
            notes: t.notes
          }));
          return res.json(formatted);
        }
      }

      if (sql) {
        const rows = await sql`SELECT * FROM transactions ORDER BY created_at DESC;`;
        const formatted = rows.map((t: any) => ({
          id: t.id,
          bookId: t.book_id,
          bookTitle: t.book_title,
          memberId: t.member_id,
          memberName: t.member_name,
          borrowDate: t.borrow_date ? new Date(t.borrow_date).toISOString().split('T')[0] : '',
          dueDate: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : '',
          returnDate: t.return_date ? new Date(t.return_date).toISOString().split('T')[0] : null,
          status: t.status,
          fineAmount: parseFloat(t.fine_amount) || 0,
          notes: t.notes
        }));
        return res.json(formatted);
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions/borrow', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { transactions: newTxList, memberId } = req.body;
    if (!Array.isArray(newTxList) || newTxList.length === 0) {
      return res.status(400).json({ error: 'No transaction items provided' });
    }

    try {
      if (client) {
        for (const tx of newTxList) {
          await client.from('transactions').insert({
            id: tx.id,
            book_id: tx.bookId,
            book_title: tx.bookTitle,
            member_id: tx.memberId,
            member_name: tx.memberName,
            borrow_date: tx.borrowDate,
            due_date: tx.dueDate,
            return_date: null,
            status: 'Berlangsung',
            fine_amount: 0,
            notes: tx.notes || 'Peminjaman Terminal'
          });

          // Update book available stock
          const { data: bData } = await client.from('books').select('available_stock').eq('id', tx.bookId).limit(1);
          if (bData && bData.length > 0) {
            const nextStock = Math.max((bData[0].available_stock || 1) - 1, 0);
            await client.from('books').update({
              available_stock: nextStock,
              status: nextStock <= 0 ? 'Dipinjam' : 'Tersedia',
              updated_at: new Date().toISOString()
            }).eq('id', tx.bookId);
          }
        }

        // Update member active loans
        if (memberId) {
          const { data: mData } = await client.from('members').select('active_loans_count').eq('id', memberId).limit(1);
          if (mData && mData.length > 0) {
            await client.from('members').update({
              active_loans_count: (mData[0].active_loans_count || 0) + newTxList.length,
              updated_at: new Date().toISOString()
            }).eq('id', memberId);
          }
        }

        return res.json({ success: true, count: newTxList.length });
      }

      if (sql) {
        for (const tx of newTxList) {
          await sql`
            INSERT INTO transactions (id, book_id, book_title, member_id, member_name, borrow_date, due_date, return_date, status, fine_amount, notes)
            VALUES (${tx.id}, ${tx.bookId}, ${tx.bookTitle}, ${tx.memberId}, ${tx.memberName}, ${tx.borrowDate}, ${tx.dueDate}, NULL, 'Berlangsung', 0, ${tx.notes || 'Peminjaman Terminal'});
          `;

          await sql`
            UPDATE books SET
              available_stock = GREATEST(available_stock - 1, 0),
              status = CASE WHEN available_stock - 1 <= 0 THEN 'Dipinjam' ELSE 'Tersedia' END,
              updated_at = NOW()
            WHERE id = ${tx.bookId};
          `;
        }

        if (memberId) {
          await sql`
            UPDATE members SET
              active_loans_count = active_loans_count + ${newTxList.length},
              updated_at = NOW()
            WHERE id = ${memberId};
          `;
        }

        return res.json({ success: true, count: newTxList.length });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      console.error('Borrow transaction error:', error);
      res.status(500).json({ error: error.message || 'Failed to process borrowing' });
    }
  });

  app.post('/api/transactions/return', async (req: Request, res: Response) => {
    const client = getSupabase();
    const sql = getDb();
    const { transactionId, bookId, memberId, returnDate, fineAmount, notes } = req.body;

    try {
      if (client) {
        await client.from('transactions').update({
          return_date: returnDate || new Date().toISOString(),
          status: 'Selesai',
          fine_amount: fineAmount || 0,
          notes: notes || 'Pengembalian Selesai',
          updated_at: new Date().toISOString()
        }).eq('id', transactionId);

        if (bookId) {
          const { data: bData } = await client.from('books').select('stock, available_stock').eq('id', bookId).limit(1);
          if (bData && bData.length > 0) {
            const nextStock = Math.min((bData[0].available_stock || 0) + 1, bData[0].stock || 1);
            await client.from('books').update({
              available_stock: nextStock,
              status: 'Tersedia',
              updated_at: new Date().toISOString()
            }).eq('id', bookId);
          }
        }

        if (memberId) {
          const { data: mData } = await client.from('members').select('active_loans_count').eq('id', memberId).limit(1);
          if (mData && mData.length > 0) {
            const nextCount = Math.max((mData[0].active_loans_count || 1) - 1, 0);
            await client.from('members').update({
              active_loans_count: nextCount,
              updated_at: new Date().toISOString()
            }).eq('id', memberId);
          }
        }

        return res.json({ success: true, message: 'Return processed successfully' });
      }

      if (sql) {
        await sql`
          UPDATE transactions SET
            return_date = ${returnDate || new Date().toISOString()},
            status = 'Selesai',
            fine_amount = ${fineAmount || 0},
            notes = ${notes || 'Pengembalian Selesai'},
            updated_at = NOW()
          WHERE id = ${transactionId};
        `;

        if (bookId) {
          await sql`
            UPDATE books SET
              available_stock = LEAST(available_stock + 1, stock),
              status = 'Tersedia',
              updated_at = NOW()
            WHERE id = ${bookId};
          `;
        }

        if (memberId) {
          await sql`
            UPDATE members SET
              active_loans_count = GREATEST(active_loans_count - 1, 0),
              updated_at = NOW()
            WHERE id = ${memberId};
          `;
        }

        return res.json({ success: true, message: 'Return processed successfully' });
      }

      return res.status(503).json({ error: 'DATABASE_NOT_CONNECTED' });
    } catch (error: any) {
      console.error('Return transaction error:', error);
      res.status(500).json({ error: 'Failed to process return' });
    }
  });

  // ============================================================================
  // FRONTEND STATIC & VITE MIDDLEWARE
  // ============================================================================

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Library Server] SMAN 1 Lumbung Server running on port ${PORT}`);
  });
}

startServer();
