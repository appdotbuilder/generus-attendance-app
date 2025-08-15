import { serial, text, pgTable, timestamp, integer, boolean, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userTypeEnum = pgEnum('user_type', ['generus', 'teacher', 'coordinator']);
export const levelEnum = pgEnum('level', ['pra-remaja', 'remaja', 'usia-mandiri-kuliah']);
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'sick', 'permitted', 'absent']);
export const testTypeEnum = pgEnum('test_type', ['tilawati', 'alquran', 'hadits', 'daily-prayers']);

// Teachers table
export const teachersTable = pgTable('teachers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Coordinators table
export const coordinatorsTable = pgTable('coordinators', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  access_code: text('access_code').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Generus table
export const generusTable = pgTable('generus', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  place_of_birth: text('place_of_birth'),
  date_of_birth: timestamp('date_of_birth'),
  sambung_group: text('sambung_group').notNull(),
  gender: genderEnum('gender'),
  level: levelEnum('level').notNull(),
  status: text('status'),
  profession: text('profession'),
  skill: text('skill'),
  notes: text('notes'),
  photo_url: text('photo_url'),
  barcode: text('barcode').unique(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// KBM Reports table
export const kbmReportsTable = pgTable('kbm_reports', {
  id: serial('id').primaryKey(),
  day_date: timestamp('day_date').notNull(),
  sambung_group: text('sambung_group').notNull(),
  teacher_id: integer('teacher_id').notNull(),
  teacher_name: text('teacher_name').notNull(),
  level: levelEnum('level').notNull(),
  material: text('material').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Attendance table
export const attendanceTable = pgTable('attendance', {
  id: serial('id').primaryKey(),
  kbm_report_id: integer('kbm_report_id').notNull(),
  generus_id: integer('generus_id').notNull(),
  generus_name: text('generus_name').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Material Info table
export const materialInfoTable = pgTable('material_info', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content'),
  link_url: text('link_url'),
  file_url: text('file_url'),
  coordinator_id: integer('coordinator_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Testing table
export const testingTable = pgTable('testing', {
  id: serial('id').primaryKey(),
  generus_id: integer('generus_id').notNull(),
  test_type: testTypeEnum('test_type').notNull(),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  notes: text('notes'),
  teacher_id: integer('teacher_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Criticism and Suggestions table
export const criticismSuggestionsTable = pgTable('criticism_suggestions', {
  id: serial('id').primaryKey(),
  user_type: userTypeEnum('user_type').notNull(),
  user_id: integer('user_id').notNull(),
  user_name: text('user_name').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Online Attendance table (separate from regular attendance)
export const onlineAttendanceTable = pgTable('online_attendance', {
  id: serial('id').primaryKey(),
  generus_id: integer('generus_id').notNull(),
  generus_barcode: text('generus_barcode').notNull(),
  teacher_id: integer('teacher_id').notNull(),
  sambung_group: text('sambung_group').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const teachersRelations = relations(teachersTable, ({ many }) => ({
  kbmReports: many(kbmReportsTable),
  testing: many(testingTable),
  onlineAttendance: many(onlineAttendanceTable)
}));

export const coordinatorsRelations = relations(coordinatorsTable, ({ many }) => ({
  materials: many(materialInfoTable)
}));

export const generusRelations = relations(generusTable, ({ many }) => ({
  attendance: many(attendanceTable),
  testing: many(testingTable),
  onlineAttendance: many(onlineAttendanceTable)
}));

export const kbmReportsRelations = relations(kbmReportsTable, ({ one, many }) => ({
  teacher: one(teachersTable, {
    fields: [kbmReportsTable.teacher_id],
    references: [teachersTable.id]
  }),
  attendance: many(attendanceTable)
}));

export const attendanceRelations = relations(attendanceTable, ({ one }) => ({
  kbmReport: one(kbmReportsTable, {
    fields: [attendanceTable.kbm_report_id],
    references: [kbmReportsTable.id]
  }),
  generus: one(generusTable, {
    fields: [attendanceTable.generus_id],
    references: [generusTable.id]
  })
}));

export const materialInfoRelations = relations(materialInfoTable, ({ one }) => ({
  coordinator: one(coordinatorsTable, {
    fields: [materialInfoTable.coordinator_id],
    references: [coordinatorsTable.id]
  })
}));

export const testingRelations = relations(testingTable, ({ one }) => ({
  generus: one(generusTable, {
    fields: [testingTable.generus_id],
    references: [generusTable.id]
  }),
  teacher: one(teachersTable, {
    fields: [testingTable.teacher_id],
    references: [teachersTable.id]
  })
}));

export const onlineAttendanceRelations = relations(onlineAttendanceTable, ({ one }) => ({
  generus: one(generusTable, {
    fields: [onlineAttendanceTable.generus_id],
    references: [generusTable.id]
  }),
  teacher: one(teachersTable, {
    fields: [onlineAttendanceTable.teacher_id],
    references: [teachersTable.id]
  })
}));

// TypeScript types for the tables
export type Teacher = typeof teachersTable.$inferSelect;
export type NewTeacher = typeof teachersTable.$inferInsert;

export type Coordinator = typeof coordinatorsTable.$inferSelect;
export type NewCoordinator = typeof coordinatorsTable.$inferInsert;

export type Generus = typeof generusTable.$inferSelect;
export type NewGenerus = typeof generusTable.$inferInsert;

export type KBMReport = typeof kbmReportsTable.$inferSelect;
export type NewKBMReport = typeof kbmReportsTable.$inferInsert;

export type Attendance = typeof attendanceTable.$inferSelect;
export type NewAttendance = typeof attendanceTable.$inferInsert;

export type MaterialInfo = typeof materialInfoTable.$inferSelect;
export type NewMaterialInfo = typeof materialInfoTable.$inferInsert;

export type Testing = typeof testingTable.$inferSelect;
export type NewTesting = typeof testingTable.$inferInsert;

export type CriticismSuggestion = typeof criticismSuggestionsTable.$inferSelect;
export type NewCriticismSuggestion = typeof criticismSuggestionsTable.$inferInsert;

export type OnlineAttendance = typeof onlineAttendanceTable.$inferSelect;
export type NewOnlineAttendance = typeof onlineAttendanceTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  teachers: teachersTable,
  coordinators: coordinatorsTable,
  generus: generusTable,
  kbmReports: kbmReportsTable,
  attendance: attendanceTable,
  materialInfo: materialInfoTable,
  testing: testingTable,
  criticismSuggestions: criticismSuggestionsTable,
  onlineAttendance: onlineAttendanceTable
};