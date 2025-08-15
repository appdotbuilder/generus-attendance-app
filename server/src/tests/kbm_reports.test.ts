import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable, generusTable, kbmReportsTable, attendanceTable } from '../db/schema';
import { type CreateKBMReport } from '../schema';
import {
  createKBMReport,
  getAllKBMReports,
  getKBMReportsByTeacher,
  getKBMReportsByDateRange,
  getKBMReportDetails,
  getKBMReportsBySambungGroup,
  updateKBMReport,
  deleteKBMReport,
  exportKBMReportsToExcel
} from '../handlers/kbm_reports';
import { eq } from 'drizzle-orm';

// Test data
const testTeacher = {
  name: 'Ahmad Fauzi',
  email: 'ahmad.fauzi@test.com',
  username: 'ahmad_fauzi',
  password_hash: 'hashed_password_123'
};

const testGenerus = {
  full_name: 'Siti Aminah',
  sambung_group: 'Group A',
  level: 'remaja' as const
};

const testKBMInput: CreateKBMReport = {
  day_date: new Date('2024-01-15T10:00:00Z'),
  sambung_group: 'Group A',
  teacher_id: 1,
  teacher_name: 'Ahmad Fauzi',
  level: 'remaja',
  material: 'Surat Al-Fatihah ayat 1-3',
  notes: 'Pembelajaran berjalan lancar',
  generus_attendance: [
    {
      generus_id: 1,
      full_name: 'Siti Aminah',
      status: 'present'
    }
  ]
};

describe('KBM Reports Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createKBMReport', () => {
    it('should create a KBM report with attendance', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      const generusResult = await db.insert(generusTable)
        .values(testGenerus)
        .returning()
        .execute();
      const generus = generusResult[0];

      // Update input with actual IDs
      const input = {
        ...testKBMInput,
        teacher_id: teacher.id,
        generus_attendance: [{
          generus_id: generus.id,
          full_name: generus.full_name,
          status: 'present' as const
        }]
      };

      const result = await createKBMReport(input);

      // Verify KBM report fields
      expect(result.id).toBeDefined();
      expect(result.day_date).toEqual(input.day_date);
      expect(result.sambung_group).toEqual(input.sambung_group);
      expect(result.teacher_id).toEqual(teacher.id);
      expect(result.teacher_name).toEqual(input.teacher_name);
      expect(result.level).toEqual(input.level);
      expect(result.material).toEqual(input.material);
      expect(result.notes).toEqual(input.notes || null);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify attendance was recorded
      const attendance = await db.select()
        .from(attendanceTable)
        .where(eq(attendanceTable.kbm_report_id, result.id))
        .execute();

      expect(attendance).toHaveLength(1);
      expect(attendance[0].generus_id).toEqual(generus.id);
      expect(attendance[0].generus_name).toEqual(generus.full_name);
      expect(attendance[0].status).toEqual('present');
    });

    it('should create KBM report without attendance', async () => {
      // Create teacher
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      const input = {
        ...testKBMInput,
        teacher_id: teacher.id,
        generus_attendance: []
      };

      const result = await createKBMReport(input);

      expect(result.id).toBeDefined();
      expect(result.teacher_id).toEqual(teacher.id);

      // Verify no attendance records
      const attendance = await db.select()
        .from(attendanceTable)
        .where(eq(attendanceTable.kbm_report_id, result.id))
        .execute();

      expect(attendance).toHaveLength(0);
    });

    it('should throw error if teacher does not exist', async () => {
      const input = {
        ...testKBMInput,
        teacher_id: 999,
        generus_attendance: []
      };

      await expect(createKBMReport(input)).rejects.toThrow(/teacher not found/i);
    });
  });

  describe('getAllKBMReports', () => {
    it('should return all KBM reports ordered by creation date', async () => {
      // Create teacher
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      // Create multiple reports
      const report1 = await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        day_date: new Date('2024-01-15'),
        material: 'Material 1',
        generus_attendance: []
      });

      const report2 = await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        day_date: new Date('2024-01-16'),
        material: 'Material 2',
        generus_attendance: []
      });

      const results = await getAllKBMReports();

      expect(results).toHaveLength(2);
      // Should be ordered by created_at desc (newest first)
      expect(results[0].id).toEqual(report2.id);
      expect(results[1].id).toEqual(report1.id);
    });

    it('should return empty array when no reports exist', async () => {
      const results = await getAllKBMReports();
      expect(results).toHaveLength(0);
    });
  });

  describe('getKBMReportsByTeacher', () => {
    it('should return reports for specific teacher only', async () => {
      // Create two teachers
      const teacher1Result = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher1 = teacher1Result[0];

      const teacher2Result = await db.insert(teachersTable)
        .values({
          ...testTeacher,
          email: 'teacher2@test.com',
          username: 'teacher2'
        })
        .returning()
        .execute();
      const teacher2 = teacher2Result[0];

      // Create reports for both teachers
      await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher1.id,
        generus_attendance: []
      });

      await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher2.id,
        generus_attendance: []
      });

      const results = await getKBMReportsByTeacher(teacher1.id);

      expect(results).toHaveLength(1);
      expect(results[0].teacher_id).toEqual(teacher1.id);
    });
  });

  describe('getKBMReportsByDateRange', () => {
    it('should return reports within date range', async () => {
      // Create teacher
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      // Create reports on different dates
      await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        day_date: new Date('2024-01-10'),
        generus_attendance: []
      });

      await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        day_date: new Date('2024-01-15'),
        generus_attendance: []
      });

      await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        day_date: new Date('2024-01-20'),
        generus_attendance: []
      });

      const results = await getKBMReportsByDateRange(
        new Date('2024-01-12'),
        new Date('2024-01-18')
      );

      expect(results).toHaveLength(1);
      expect(results[0].day_date).toEqual(new Date('2024-01-15'));
    });
  });

  describe('getKBMReportDetails', () => {
    it('should return report with attendance details', async () => {
      // Create prerequisites
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      const generusResult = await db.insert(generusTable)
        .values(testGenerus)
        .returning()
        .execute();
      const generus = generusResult[0];

      // Create report with attendance
      const report = await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        generus_attendance: [{
          generus_id: generus.id,
          full_name: generus.full_name,
          status: 'present'
        }]
      });

      const result = await getKBMReportDetails(report.id);

      expect(result).toBeDefined();
      expect(result!.report.id).toEqual(report.id);
      expect(result!.attendance).toHaveLength(1);
      expect(result!.attendance[0].generus_id).toEqual(generus.id);
      expect(result!.attendance[0].status).toEqual('present');
    });

    it('should return null for non-existent report', async () => {
      const result = await getKBMReportDetails(999);
      expect(result).toBeNull();
    });
  });

  describe('getKBMReportsBySambungGroup', () => {
    it('should return reports for specific sambung group', async () => {
      // Create teacher
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      // Create reports for different groups
      await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        sambung_group: 'Group A',
        generus_attendance: []
      });

      await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        sambung_group: 'Group B',
        generus_attendance: []
      });

      const results = await getKBMReportsBySambungGroup('Group A');

      expect(results).toHaveLength(1);
      expect(results[0].sambung_group).toEqual('Group A');
    });
  });

  describe('updateKBMReport', () => {
    it('should update KBM report successfully', async () => {
      // Create teacher
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      // Create report
      const report = await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        generus_attendance: []
      });

      // Update report
      const updates = {
        material: 'Updated material content',
        notes: 'Updated notes'
      };

      const result = await updateKBMReport(report.id, updates);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(report.id);
      expect(result!.material).toEqual(updates.material);
      expect(result!.notes).toEqual(updates.notes);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for non-existent report', async () => {
      const result = await updateKBMReport(999, { material: 'Updated' });
      expect(result).toBeNull();
    });
  });

  describe('deleteKBMReport', () => {
    it('should delete KBM report and associated attendance', async () => {
      // Create prerequisites
      const teacherResult = await db.insert(teachersTable)
        .values(testTeacher)
        .returning()
        .execute();
      const teacher = teacherResult[0];

      const generusResult = await db.insert(generusTable)
        .values(testGenerus)
        .returning()
        .execute();
      const generus = generusResult[0];

      // Create report with attendance
      const report = await createKBMReport({
        ...testKBMInput,
        teacher_id: teacher.id,
        generus_attendance: [{
          generus_id: generus.id,
          full_name: generus.full_name,
          status: 'present'
        }]
      });

      const result = await deleteKBMReport(report.id);

      expect(result.success).toBe(true);
      expect(result.message).toEqual('KBM report deleted successfully');

      // Verify report is deleted
      const deletedReport = await db.select()
        .from(kbmReportsTable)
        .where(eq(kbmReportsTable.id, report.id))
        .execute();

      expect(deletedReport).toHaveLength(0);

      // Verify attendance is deleted
      const deletedAttendance = await db.select()
        .from(attendanceTable)
        .where(eq(attendanceTable.kbm_report_id, report.id))
        .execute();

      expect(deletedAttendance).toHaveLength(0);
    });

    it('should return failure message for non-existent report', async () => {
      const result = await deleteKBMReport(999);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('KBM report not found');
    });
  });

  describe('exportKBMReportsToExcel', () => {
    it('should return file URL for export without filters', async () => {
      const result = await exportKBMReportsToExcel();

      expect(result.fileUrl).toBeDefined();
      expect(result.fileUrl).toMatch(/^\/exports\/kbm-reports-\d+\.xlsx$/);
    });

    it('should return file URL for export with filters', async () => {
      const filters = {
        teacherId: 1,
        sambungGroup: 'Group A',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      const result = await exportKBMReportsToExcel(filters);

      expect(result.fileUrl).toBeDefined();
      expect(result.fileUrl).toMatch(/^\/exports\/kbm-reports-\d+\.xlsx$/);
    });
  });
});