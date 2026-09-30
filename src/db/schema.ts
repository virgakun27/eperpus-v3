import { pgTable, text, varchar, integer, numeric, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==============================================================================
// 1. ENUMS
// ==============================================================================
export const userRoleEnum = pgEnum('user_role', ['Admin', 'Petugas Perpus', 'Guru', 'Kepsek', 'Siswa']);
export const memberStatusEnum = pgEnum('member_status', ['Aktif', 'Ditangguhkan', 'Nonaktif']);
export const memberTypeEnum = pgEnum('member_type', ['Siswa', 'Mahasiswa', 'Dosen', 'Staf', 'Umum']);
export const bookStatusEnum = pgEnum('book_status', ['Tersedia', 'Dipinjam', 'Hilang', 'Rusak']);
export const transactionStatusEnum = pgEnum('transaction_status', ['Berlangsung', 'Selesai', 'Terlambat']);
export const genderTypeEnum = pgEnum('gender_type', ['L', 'P']);
export const gradeLevelEnum = pgEnum('grade_level', ['X', 'XI', 'XII']);

// ==============================================================================
// 2. TABLES
// ==============================================================================

// A. Classes Table
export const classes = pgTable('classes', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. K001
  name: varchar('name', { length: 100 }).notNull(), // e.g. X MIPA 1
  gradeLevel: gradeLevelEnum('grade_level').notNull(),
  academicYear: varchar('academic_year', { length: 20 }).default('2025/2026').notNull(),
  homeroomTeacher: varchar('homeroom_teacher', { length: 150 }).notNull(),
  studentCount: integer('student_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// B. Students Table
export const students = pgTable('students', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. S001
  nis: varchar('nis', { length: 50 }).unique().notNull(),
  nisn: varchar('nisn', { length: 50 }).unique(),
  name: varchar('name', { length: 150 }).notNull(),
  gender: genderTypeEnum('gender').default('L').notNull(),
  classId: varchar('class_id', { length: 50 }).references(() => classes.id),
  className: varchar('class_name', { length: 100 }).notNull(),
  rfidCard: varchar('rfid_card', { length: 100 }).unique().notNull(),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 50 }),
  username: varchar('username', { length: 100 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  status: memberStatusEnum('status').default('Aktif').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// C. Members Table
export const members = pgTable('members', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. M001
  name: varchar('name', { length: 150 }).notNull(),
  status: memberStatusEnum('status').default('Aktif').notNull(),
  rfidCard: varchar('rfid_card', { length: 100 }).unique().notNull(),
  type: memberTypeEnum('type').default('Siswa').notNull(),
  email: varchar('email', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  maxBooks: integer('max_books').default(3).notNull(),
  activeLoansCount: integer('active_loans_count').default(0).notNull(),
  studentId: varchar('student_id', { length: 50 }).references(() => students.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// D. Books Table
export const books = pgTable('books', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. B001
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 150 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  isbn: varchar('isbn', { length: 50 }).unique().notNull(),
  status: bookStatusEnum('status').default('Tersedia').notNull(),
  stock: integer('stock').default(1).notNull(),
  availableStock: integer('available_stock').default(1).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  coverColor: varchar('cover_color', { length: 100 }).default('bg-amber-100 text-amber-900 border-amber-300').notNull(),
  description: text('description'),
  publishYear: integer('publish_year').default(2024).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// E. Transactions Table
export const transactions = pgTable('transactions', {
  id: varchar('id', { length: 100 }).primaryKey(), // e.g. TRX-1001
  bookId: varchar('book_id', { length: 50 }).references(() => books.id).notNull(),
  bookTitle: varchar('book_title', { length: 255 }).notNull(),
  memberId: varchar('member_id', { length: 50 }).references(() => members.id).notNull(),
  memberName: varchar('member_name', { length: 150 }).notNull(),
  borrowDate: date('borrow_date').defaultNow().notNull(),
  dueDate: date('due_date').notNull(), // 4 Business days
  returnDate: timestamp('return_date', { withTimezone: true }),
  status: transactionStatusEnum('status').default('Berlangsung').notNull(),
  fineAmount: numeric('fine_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// F. Users Table
export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. U001
  name: varchar('name', { length: 150 }).notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  email: varchar('email', { length: 150 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('Admin').notNull(),
  status: memberStatusEnum('status').default('Aktif').notNull(),
  rfidCard: varchar('rfid_card', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// G. Security Tokens Table (Stores server-side access tokens securely in DB)
export const securityTokens = pgTable('security_tokens', {
  id: varchar('id', { length: 50 }).primaryKey(),
  tokenKey: varchar('token_key', { length: 100 }).unique().notNull(), // e.g. 'DB_STUDIO_ACCESS'
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  isActive: varchar('is_active', { length: 10 }).default('true').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ==============================================================================
// 3. RELATIONS
// ==============================================================================
export const classesRelations = relations(classes, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  student: one(students, {
    fields: [members.studentId],
    references: [students.id],
  }),
  transactions: many(transactions),
}));

export const booksRelations = relations(books, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  book: one(books, {
    fields: [transactions.bookId],
    references: [books.id],
  }),
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
}));
