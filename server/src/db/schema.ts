import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  date,
  pgEnum,
  boolean,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const jenjangEnum = pgEnum('jenjang', [
  'Paud/TK', 
  'Caberawit', 
  'Pra-Remaja', 
  'Remaja', 
  'Usia Mandiri/Kuliah', 
  'Usia Mandiri'
]);

export const kelompokSambungEnum = pgEnum('kelompok_sambung', [
  'Kelompok Situbondo Kota', 
  'Kelompok Mangaran', 
  'Kelompok Besuki'
]);

export const jenisKelaminEnum = pgEnum('jenis_kelamin', [
  'Laki-laki', 
  'Perempuan'
]);

export const kehadiranStatusEnum = pgEnum('kehadiran_status', [
  'Hadir', 
  'Sakit', 
  'Izin', 
  'Tidak Hadir/Alfa'
]);

// User tables
export const generusTable = pgTable('generus', {
  id: serial('id').primaryKey(),
  nama_lengkap: text('nama_lengkap').notNull(),
  tempat_lahir: text('tempat_lahir'),
  tanggal_lahir: date('tanggal_lahir'),
  kelompok_sambung: kelompokSambungEnum('kelompok_sambung').notNull(),
  jenis_kelamin: jenisKelaminEnum('jenis_kelamin').notNull(),
  jenjang: jenjangEnum('jenjang').notNull(),
  status: text('status'),
  profesi: text('profesi'),
  keahlian: text('keahlian'),
  keterangan: text('keterangan'),
  foto_url: text('foto_url'),
  barcode: varchar('barcode', { length: 100 }).notNull().unique(), // Unique barcode for attendance
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const guruPengajarTable = pgTable('guru_pengajar', {
  id: serial('id').primaryKey(),
  nama_lengkap: text('nama_lengkap').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: text('password').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const koordinatorTable = pgTable('koordinator', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  kode_masuk: varchar('kode_masuk', { length: 100 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// KBM Report tables
export const laporanKbmTable = pgTable('laporan_kbm', {
  id: serial('id').primaryKey(),
  tanggal: date('tanggal').notNull(),
  kelompok_sambung: kelompokSambungEnum('kelompok_sambung').notNull(),
  nama_pengajar: text('nama_pengajar').notNull(),
  jenjang: jenjangEnum('jenjang').notNull(),
  materi: text('materi').notNull(),
  keterangan: text('keterangan'),
  guru_id: integer('guru_id').notNull().references(() => guruPengajarTable.id),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const kehadiranGenerusTable = pgTable('kehadiran_generus', {
  id: serial('id').primaryKey(),
  laporan_id: integer('laporan_id').notNull().references(() => laporanKbmTable.id),
  nama_generus: text('nama_generus').notNull(),
  status_kehadiran: kehadiranStatusEnum('status_kehadiran').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Material table
export const materiTable = pgTable('materi', {
  id: serial('id').primaryKey(),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi').notNull(),
  link_url: text('link_url'),
  file_url: text('file_url'),
  koordinator_id: integer('koordinator_id').notNull().references(() => koordinatorTable.id),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Online attendance table
export const absensiOnlineTable = pgTable('absensi_online', {
  id: serial('id').primaryKey(),
  generus_id: integer('generus_id').notNull().references(() => generusTable.id),
  tanggal: date('tanggal').notNull(),
  waktu_scan: timestamp('waktu_scan').defaultNow().notNull(),
  guru_scanner_id: integer('guru_scanner_id').references(() => guruPengajarTable.id),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const laporanKbmRelations = relations(laporanKbmTable, ({ one, many }) => ({
  guru: one(guruPengajarTable, {
    fields: [laporanKbmTable.guru_id],
    references: [guruPengajarTable.id]
  }),
  kehadiranGenerus: many(kehadiranGenerusTable)
}));

export const kehadiranGenerusRelations = relations(kehadiranGenerusTable, ({ one }) => ({
  laporan: one(laporanKbmTable, {
    fields: [kehadiranGenerusTable.laporan_id],
    references: [laporanKbmTable.id]
  })
}));

export const materiRelations = relations(materiTable, ({ one }) => ({
  koordinator: one(koordinatorTable, {
    fields: [materiTable.koordinator_id],
    references: [koordinatorTable.id]
  })
}));

export const absensiOnlineRelations = relations(absensiOnlineTable, ({ one }) => ({
  generus: one(generusTable, {
    fields: [absensiOnlineTable.generus_id],
    references: [generusTable.id]
  }),
  guruScanner: one(guruPengajarTable, {
    fields: [absensiOnlineTable.guru_scanner_id],
    references: [guruPengajarTable.id]
  })
}));

export const guruPengajarRelations = relations(guruPengajarTable, ({ many }) => ({
  laporanKbm: many(laporanKbmTable),
  absensiScanned: many(absensiOnlineTable)
}));

export const koordinatorRelations = relations(koordinatorTable, ({ many }) => ({
  materi: many(materiTable)
}));

export const generusRelations = relations(generusTable, ({ many }) => ({
  absensiOnline: many(absensiOnlineTable)
}));

// TypeScript types for the table schemas
export type Generus = typeof generusTable.$inferSelect;
export type NewGenerus = typeof generusTable.$inferInsert;

export type GuruPengajar = typeof guruPengajarTable.$inferSelect;
export type NewGuruPengajar = typeof guruPengajarTable.$inferInsert;

export type Koordinator = typeof koordinatorTable.$inferSelect;
export type NewKoordinator = typeof koordinatorTable.$inferInsert;

export type LaporanKbm = typeof laporanKbmTable.$inferSelect;
export type NewLaporanKbm = typeof laporanKbmTable.$inferInsert;

export type KehadiranGenerus = typeof kehadiranGenerusTable.$inferSelect;
export type NewKehadiranGenerus = typeof kehadiranGenerusTable.$inferInsert;

export type Materi = typeof materiTable.$inferSelect;
export type NewMateri = typeof materiTable.$inferInsert;

export type AbsensiOnline = typeof absensiOnlineTable.$inferSelect;
export type NewAbsensiOnline = typeof absensiOnlineTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  generus: generusTable,
  guruPengajar: guruPengajarTable,
  koordinator: koordinatorTable,
  laporanKbm: laporanKbmTable,
  kehadiranGenerus: kehadiranGenerusTable,
  materi: materiTable,
  absensiOnline: absensiOnlineTable
};