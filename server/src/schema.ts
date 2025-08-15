import { z } from 'zod';

// Enums
export const jenjangEnum = z.enum(['Paud/TK', 'Caberawit', 'Pra-Remaja', 'Remaja', 'Usia Mandiri/Kuliah', 'Usia Mandiri']);
export const kelompokSambungEnum = z.enum(['Kelompok Situbondo Kota', 'Kelompok Mangaran', 'Kelompok Besuki']);
export const jenisKelaminEnum = z.enum(['Laki-laki', 'Perempuan']);
export const kehadiranStatusEnum = z.enum(['Hadir', 'Sakit', 'Izin', 'Tidak Hadir/Alfa']);
export const userRoleEnum = z.enum(['generus', 'guru_pengajar', 'koordinator']);

// User schemas
export const generusSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string(),
  tempat_lahir: z.string().nullable(),
  tanggal_lahir: z.coerce.date().nullable(),
  kelompok_sambung: kelompokSambungEnum,
  jenis_kelamin: jenisKelaminEnum,
  jenjang: jenjangEnum,
  status: z.string().nullable(),
  profesi: z.string().nullable(),
  keahlian: z.string().nullable(),
  keterangan: z.string().nullable(),
  foto_url: z.string().nullable(),
  barcode: z.string(), // Unique barcode for attendance
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Generus = z.infer<typeof generusSchema>;

export const guruPengajarSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string(),
  email: z.string().email(),
  username: z.string(),
  password: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type GuruPengajar = z.infer<typeof guruPengajarSchema>;

export const koordinatorSchema = z.object({
  id: z.number(),
  nama: z.string(),
  kode_masuk: z.string(),
  created_at: z.coerce.date()
});

export type Koordinator = z.infer<typeof koordinatorSchema>;

// KBM Report schemas
export const laporanKbmSchema = z.object({
  id: z.number(),
  tanggal: z.coerce.date(),
  kelompok_sambung: kelompokSambungEnum,
  nama_pengajar: z.string(),
  jenjang: jenjangEnum,
  materi: z.string(),
  keterangan: z.string().nullable(),
  guru_id: z.number(),
  created_at: z.coerce.date()
});

export type LaporanKbm = z.infer<typeof laporanKbmSchema>;

export const kehadiranGenerusSchema = z.object({
  id: z.number(),
  laporan_id: z.number(),
  nama_generus: z.string(),
  status_kehadiran: kehadiranStatusEnum,
  created_at: z.coerce.date()
});

export type KehadiranGenerus = z.infer<typeof kehadiranGenerusSchema>;

// Material schemas
export const materiSchema = z.object({
  id: z.number(),
  judul: z.string(),
  deskripsi: z.string(),
  link_url: z.string().nullable(),
  file_url: z.string().nullable(),
  koordinator_id: z.number(),
  created_at: z.coerce.date()
});

export type Materi = z.infer<typeof materiSchema>;

// Online attendance schemas
export const absensiOnlineSchema = z.object({
  id: z.number(),
  generus_id: z.number(),
  tanggal: z.coerce.date(),
  waktu_scan: z.coerce.date(),
  guru_scanner_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type AbsensiOnline = z.infer<typeof absensiOnlineSchema>;

// Input schemas for creating records
export const createGenerusInputSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  tempat_lahir: z.string().nullable(),
  tanggal_lahir: z.coerce.date().nullable(),
  kelompok_sambung: kelompokSambungEnum,
  jenis_kelamin: jenisKelaminEnum,
  jenjang: jenjangEnum,
  status: z.string().nullable(),
  profesi: z.string().nullable(),
  keahlian: z.string().nullable(),
  keterangan: z.string().nullable(),
  foto_url: z.string().nullable()
});

export type CreateGenerusInput = z.infer<typeof createGenerusInputSchema>;

export const updateGenerusInputSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string().min(1, 'Nama lengkap harus diisi').optional(),
  tempat_lahir: z.string().nullable().optional(),
  tanggal_lahir: z.coerce.date().nullable().optional(),
  kelompok_sambung: kelompokSambungEnum.optional(),
  jenis_kelamin: jenisKelaminEnum.optional(),
  jenjang: jenjangEnum.optional(),
  status: z.string().nullable().optional(),
  profesi: z.string().nullable().optional(),
  keahlian: z.string().nullable().optional(),
  keterangan: z.string().nullable().optional(),
  foto_url: z.string().nullable().optional()
});

export type UpdateGenerusInput = z.infer<typeof updateGenerusInputSchema>;

export const registerGuruPengajarInputSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

export type RegisterGuruPengajarInput = z.infer<typeof registerGuruPengajarInputSchema>;

export const loginGuruPengajarInputSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
  remember_me: z.boolean().optional()
});

export type LoginGuruPengajarInput = z.infer<typeof loginGuruPengajarInputSchema>;

export const loginGenerusInputSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  jenjang: jenjangEnum,
  kelompok_sambung: kelompokSambungEnum
});

export type LoginGenerusInput = z.infer<typeof loginGenerusInputSchema>;

export const loginKoordinatorInputSchema = z.object({
  nama: z.string().min(1, 'Nama koordinator harus diisi'),
  kode_masuk: z.string().min(1, 'Kode masuk harus diisi')
});

export type LoginKoordinatorInput = z.infer<typeof loginKoordinatorInputSchema>;

export const createLaporanKbmInputSchema = z.object({
  tanggal: z.coerce.date(),
  kelompok_sambung: kelompokSambungEnum,
  nama_pengajar: z.string().min(1, 'Nama pengajar harus diisi'),
  jenjang: jenjangEnum,
  materi: z.string().min(1, 'Materi harus diisi'),
  keterangan: z.string().nullable(),
  guru_id: z.number(),
  kehadiran_generus: z.array(z.object({
    nama_generus: z.string().min(1, 'Nama generus harus diisi'),
    status_kehadiran: kehadiranStatusEnum
  }))
});

export type CreateLaporanKbmInput = z.infer<typeof createLaporanKbmInputSchema>;

export const createMateriInputSchema = z.object({
  judul: z.string().min(1, 'Judul materi harus diisi'),
  deskripsi: z.string().min(1, 'Deskripsi materi harus diisi'),
  link_url: z.string().nullable(),
  file_url: z.string().nullable(),
  koordinator_id: z.number()
});

export type CreateMateriInput = z.infer<typeof createMateriInputSchema>;

export const scanBarcodeInputSchema = z.object({
  barcode: z.string().min(1, 'Barcode harus diisi'),
  guru_scanner_id: z.number().nullable()
});

export type ScanBarcodeInput = z.infer<typeof scanBarcodeInputSchema>;

// Filter schemas
export const rekapanLaporanFilterSchema = z.object({
  kelompok_sambung: kelompokSambungEnum.optional(),
  jenjang: jenjangEnum.optional(),
  bulan: z.number().min(1).max(12).optional(),
  tahun: z.number().optional()
});

export type RekapanLaporanFilter = z.infer<typeof rekapanLaporanFilterSchema>;

// Response schemas
export const statistikKehadiranSchema = z.object({
  total_laporan: z.number(),
  rata_rata_kehadiran: z.number(),
  guru_aktif: z.number(),
  bulan_ini: z.number()
});

export type StatistikKehadiran = z.infer<typeof statistikKehadiranSchema>;

export const authResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.number(),
    nama: z.string(),
    role: userRoleEnum
  }).optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;