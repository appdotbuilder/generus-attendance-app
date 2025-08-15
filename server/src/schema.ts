import { z } from 'zod';

// User types enum
export const userTypeSchema = z.enum(['generus', 'teacher', 'coordinator']);
export type UserType = z.infer<typeof userTypeSchema>;

// Level enum for Generus
export const levelSchema = z.enum(['pra-remaja', 'remaja', 'usia-mandiri-kuliah']);
export type Level = z.infer<typeof levelSchema>;

// Gender enum
export const genderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof genderSchema>;

// Attendance status enum
export const attendanceStatusSchema = z.enum(['present', 'sick', 'permitted', 'absent']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

// Test type enum
export const testTypeSchema = z.enum(['tilawati', 'alquran', 'hadits', 'daily-prayers']);
export type TestType = z.infer<typeof testTypeSchema>;

// Teacher schema
export const teacherSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  username: z.string(),
  password_hash: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Teacher = z.infer<typeof teacherSchema>;

// Teacher registration input
export const teacherRegistrationSchema = z.object({
  name: z.string().min(1, 'Teacher name is required'),
  email: z.string().email('Valid email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type TeacherRegistration = z.infer<typeof teacherRegistrationSchema>;

// Teacher login input
export const teacherLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember_me: z.boolean().optional()
});

export type TeacherLogin = z.infer<typeof teacherLoginSchema>;

// Coordinator schema
export const coordinatorSchema = z.object({
  id: z.number(),
  name: z.string(),
  access_code: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Coordinator = z.infer<typeof coordinatorSchema>;

// Coordinator login input
export const coordinatorLoginSchema = z.object({
  name: z.string().min(1, 'Coordinator name is required'),
  access_code: z.string().min(1, 'Access code is required')
});

export type CoordinatorLogin = z.infer<typeof coordinatorLoginSchema>;

// Generus schema
export const generusSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  place_of_birth: z.string().nullable(),
  date_of_birth: z.coerce.date().nullable(),
  sambung_group: z.string(),
  gender: genderSchema.nullable(),
  level: levelSchema,
  status: z.string().nullable(),
  profession: z.string().nullable(),
  skill: z.string().nullable(),
  notes: z.string().nullable(),
  photo_url: z.string().nullable(),
  barcode: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Generus = z.infer<typeof generusSchema>;

// Generus login input
export const generusLoginSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  level: levelSchema,
  sambung_group: z.string().min(1, 'Sambung group is required')
});

export type GenerusLogin = z.infer<typeof generusLoginSchema>;

// Generus data input
export const generusDataInputSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  place_of_birth: z.string().optional(),
  date_of_birth: z.coerce.date().optional(),
  sambung_group: z.string().min(1, 'Sambung group is required'),
  gender: genderSchema.optional(),
  level: levelSchema,
  status: z.string().optional(),
  profession: z.string().optional(),
  skill: z.string().optional(),
  notes: z.string().optional(),
  photo_url: z.string().optional()
});

export type GenerusDataInput = z.infer<typeof generusDataInputSchema>;

// Update Generus input
export const updateGenerusSchema = z.object({
  id: z.number(),
  full_name: z.string().optional(),
  place_of_birth: z.string().nullable().optional(),
  date_of_birth: z.coerce.date().nullable().optional(),
  sambung_group: z.string().optional(),
  gender: genderSchema.nullable().optional(),
  level: levelSchema.optional(),
  status: z.string().nullable().optional(),
  profession: z.string().nullable().optional(),
  skill: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional()
});

export type UpdateGenerus = z.infer<typeof updateGenerusSchema>;

// KBM Report schema
export const kbmReportSchema = z.object({
  id: z.number(),
  day_date: z.coerce.date(),
  sambung_group: z.string(),
  teacher_id: z.number(),
  teacher_name: z.string(),
  level: levelSchema,
  material: z.string(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type KBMReport = z.infer<typeof kbmReportSchema>;

// KBM Report input
export const createKBMReportSchema = z.object({
  day_date: z.coerce.date(),
  sambung_group: z.string().min(1, 'Sambung group is required'),
  teacher_id: z.number(),
  teacher_name: z.string().min(1, 'Teacher name is required'),
  level: levelSchema,
  material: z.string().min(1, 'Material is required'),
  notes: z.string().optional(),
  generus_attendance: z.array(z.object({
    generus_id: z.number(),
    full_name: z.string(),
    status: attendanceStatusSchema
  }))
});

export type CreateKBMReport = z.infer<typeof createKBMReportSchema>;

// Attendance schema
export const attendanceSchema = z.object({
  id: z.number(),
  kbm_report_id: z.number(),
  generus_id: z.number(),
  generus_name: z.string(),
  status: attendanceStatusSchema,
  created_at: z.coerce.date()
});

export type Attendance = z.infer<typeof attendanceSchema>;

// Online attendance input
export const onlineAttendanceSchema = z.object({
  generusBarcode: z.string().min(1, 'Barcode is required'),
  teacherId: z.number()
});

export type OnlineAttendance = z.infer<typeof onlineAttendanceSchema>;

// Material Info schema
export const materialInfoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  link_url: z.string().nullable(),
  file_url: z.string().nullable(),
  coordinator_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MaterialInfo = z.infer<typeof materialInfoSchema>;

// Material Info input
export const createMaterialInfoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().optional(),
  link_url: z.string().url().optional(),
  file_url: z.string().optional(),
  coordinator_id: z.number()
});

export type CreateMaterialInfo = z.infer<typeof createMaterialInfoSchema>;

// Testing schema
export const testingSchema = z.object({
  id: z.number(),
  generus_id: z.number(),
  test_type: testTypeSchema,
  score: z.number().min(0).max(100),
  notes: z.string().nullable(),
  teacher_id: z.number(),
  created_at: z.coerce.date()
});

export type Testing = z.infer<typeof testingSchema>;

// Testing input
export const createTestingSchema = z.object({
  generus_id: z.number(),
  test_type: testTypeSchema,
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
  teacher_id: z.number()
});

export type CreateTesting = z.infer<typeof createTestingSchema>;

// Criticism and Suggestions schema
export const criticismSuggestionSchema = z.object({
  id: z.number(),
  user_type: userTypeSchema,
  user_id: z.number(),
  user_name: z.string(),
  message: z.string(),
  created_at: z.coerce.date()
});

export type CriticismSuggestion = z.infer<typeof criticismSuggestionSchema>;

// Criticism and Suggestions input
export const createCriticismSuggestionSchema = z.object({
  user_type: userTypeSchema,
  user_id: z.number(),
  user_name: z.string().min(1, 'User name is required'),
  message: z.string().min(1, 'Message is required')
});

export type CreateCriticismSuggestion = z.infer<typeof createCriticismSuggestionSchema>;

// Dashboard statistics schema
export const dashboardStatsSchema = z.object({
  total_reports: z.number(),
  average_attendance: z.number(),
  active_teachers: z.number(),
  this_month_reports: z.number(),
  total_generus: z.number(),
  active_generus: z.number()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Monthly attendance data for charts
export const monthlyAttendanceSchema = z.object({
  month: z.string(),
  generus_attendance: z.number(),
  teacher_attendance: z.number()
});

export type MonthlyAttendance = z.infer<typeof monthlyAttendanceSchema>;

// Generus attendance statistics
export const generusAttendanceStatsSchema = z.object({
  generus_id: z.number(),
  total_sessions: z.number(),
  present_count: z.number(),
  sick_count: z.number(),
  permitted_count: z.number(),
  absent_count: z.number(),
  attendance_percentage: z.number()
});

export type GenerusAttendanceStats = z.infer<typeof generusAttendanceStatsSchema>;

// ID parameter schema for common operations
export const idParamSchema = z.object({
  id: z.number()
});

export type IdParam = z.infer<typeof idParamSchema>;

// Barcode parameter schema
export const barcodeParamSchema = z.object({
  barcode: z.string()
});

export type BarcodeParam = z.infer<typeof barcodeParamSchema>;

// KBM Report export filters schema
export const kbmReportExportFiltersSchema = z.object({
  teacherId: z.number().optional(),
  sambungGroup: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

export type KBMReportExportFilters = z.infer<typeof kbmReportExportFiltersSchema>;