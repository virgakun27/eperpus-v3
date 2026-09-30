import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://samnjusvxjuqsnnhjucj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_QRmr07AWqRIHJswHQ-tNBw_r0UOFXWo';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

// Password hashing helper
export function hashPassword(plainText) {
  if (!plainText) return '';
  if (plainText.startsWith('$2a$') || plainText.startsWith('$2b$') || plainText.startsWith('$2y$')) {
    return plainText;
  }
  return bcrypt.hashSync(plainText, 10);
}

// ============================================================================
// 1. HEALTH-CHECK ENDPOINT
// ============================================================================
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  try {
    if (!isSupabaseConfigured || !supabase) {
      return res.status(200).json({
        status: 'standby',
        database: 'disconnected',
        configured: false,
        message: 'SUPABASE_URL atau PUBLISHABLE_KEY belum dikonfigurasi.',
        timestamp: new Date().toISOString()
      });
    }

    // Ping Supabase PostgREST endpoint
    const { count, error } = await supabase.from('books').select('count', { count: 'exact', head: true });
    const latencyMs = Date.now() - startTime;

    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      provider: 'Supabase PostgreSQL',
      configured: true,
      latencyMs,
      serverTime: new Date().toISOString(),
      booksCount: count ?? 0,
      note: error ? error.message : 'Terkoneksi normal'
    });
  } catch (error) {
    console.error('[Health Check Error]:', error);
    return res.status(500).json({
      status: 'error',
      database: 'error',
      message: 'Failed to connect to Supabase PostgreSQL database.',
      error: error.message
    });
  }
});

// ============================================================================
// 2. BOOKS ENDPOINTS
// ============================================================================

// GET /api/books - Retrieve all books from Supabase
app.get('/api/books', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'DATABASE_NOT_CONFIGURED',
        message: 'Supabase connection is not available.'
      });
    }

    const { data: rows, error } = await supabase
      .from('books')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }
    
    // Map column names to frontend-friendly camelCase
    const books = (rows || []).map((b) => ({
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

    return res.status(200).json(books);
  } catch (error) {
    console.error('[GET /api/books Error]:', error);
    return res.status(500).json({
      error: 'FETCH_BOOKS_FAILED',
      message: error.message || 'Failed to retrieve books from database.'
    });
  }
});

// POST /api/books - Add or update a book in Supabase
app.post('/api/books', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'DATABASE_NOT_CONFIGURED',
        message: 'Supabase connection is not available.'
      });
    }

    const {
      id,
      title,
      author,
      category,
      isbn,
      status = 'Tersedia',
      stock = 1,
      availableStock,
      location = 'Rak Utama',
      coverColor = 'bg-amber-100 text-amber-900 border-amber-300',
      description = '',
      publishYear = new Date().getFullYear()
    } = req.body;

    if (!id || !title || !author || !category || !isbn) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required book fields (id, title, author, category, isbn).'
      });
    }

    const effectiveAvailableStock = availableStock !== undefined ? availableStock : stock;

    const payload = {
      id,
      title,
      author,
      category,
      isbn,
      status,
      stock,
      available_stock: effectiveAvailableStock,
      location,
      cover_color: coverColor,
      description,
      publish_year: publishYear,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('books')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Book successfully saved in Supabase PostgreSQL database.'
    });
  } catch (error) {
    console.error('[POST /api/books Error]:', error);
    return res.status(500).json({
      error: 'SAVE_BOOK_FAILED',
      message: error.message || 'Failed to save book to database.'
    });
  }
});

// Start listening if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Backend] Supabase API Server running on port ${PORT}`);
  });
}

export default app;
