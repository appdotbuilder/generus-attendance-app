import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { attendanceTable, onlineAttendanceTable, generusTable, teachersTable, kbmReportsTable } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
  recordOnlineAttendance,
  getAttendanceByKBMReport,
  getAttendanceByGenerus,
  getOnlineAttendanceBySambungGroup,
  getGenerusAttendanceStats,
  getAttendanceSummary,
  getAttendanceByDateRange,
  updateAttendanceStatus,
  getAllOnlineAttendance
} from '../handlers/attendance';

// Test data
const testTeacher = {
  name: 'Test Teacher',
  email: 'teacher@test.com',
  username: 'teacher1',
  password_hash: 'hashedpassword',
  is_active: true
};

const testGenerus = {
  full_name: 'Test Generus',
  place_of_birth: 'Jakarta',
  date_of_birth: new Date('1990-01-01'),
  sambung_group: 'Group A',
  gender: 'male' as const,
  level: 'remaja' as const,
  status: 'Active',
  profession: 'Student',
  skill: 'Programming',
  notes: 'Test notes',
  photo_url: 'photo.jpg',
  barcode: 'TEST123456',
  is_active: true
};

const testKBMReport = {
  day_date: new Date('2024-01-15'),
  sambung_group: 'Group A',
  teacher_id: 1,
  teacher_name: 'Test Teacher',
  level: 'remaja' as const,
  material: 'Test Material',
  notes: 'Test notes'
};

describe('attendance handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('recordOnlineAttendance', () => {
    it('should record online attendance successfully', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      
      const result = await recordOnlineAttendance({
        generusBarcode: 'TEST123456',
        teacherId: teacherResult[0].id
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Attendance recorded successfully');
      expect(result.generus).toBeDefined();
      expect(result.generus.full_name).toBe('Test Generus');

      // Verify record was saved
      const onlineAttendance = await db.select()
        .from(onlineAttendanceTable)
        .where(eq(onlineAttendanceTable.generus_id, generusResult[0].id))
        .execute();

      expect(onlineAttendance).toHaveLength(1);
      expect(onlineAttendance[0].generus_barcode).toBe('TEST123456');
      expect(onlineAttendance[0].sambung_group).toBe('Group A');
    });

    it('should fail when generus not found', async () => {
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      
      const result = await recordOnlineAttendance({
        generusBarcode: 'INVALID123',
        teacherId: teacherResult[0].id
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Generus not found or inactive');
    });

    it('should prevent duplicate attendance on same day', async () => {
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      
      // Record first attendance
      await recordOnlineAttendance({
        generusBarcode: 'TEST123456',
        teacherId: teacherResult[0].id
      });

      // Try to record again
      const result = await recordOnlineAttendance({
        generusBarcode: 'TEST123456',
        teacherId: teacherResult[0].id
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Attendance already recorded today for this generus');
    });

    it('should fail when generus is inactive', async () => {
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      await db.insert(generusTable).values({
        ...testGenerus,
        is_active: false,
        barcode: 'INACTIVE123'
      }).execute();
      
      const result = await recordOnlineAttendance({
        generusBarcode: 'INACTIVE123',
        teacherId: teacherResult[0].id
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Generus not found or inactive');
    });
  });

  describe('getAttendanceByKBMReport', () => {
    it('should get attendance records by KBM report', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      const kbmResult = await db.insert(kbmReportsTable).values({
        ...testKBMReport,
        teacher_id: teacherResult[0].id
      }).returning().execute();

      // Create attendance record
      await db.insert(attendanceTable).values({
        kbm_report_id: kbmResult[0].id,
        generus_id: generusResult[0].id,
        generus_name: 'Test Generus',
        status: 'present'
      }).execute();

      const result = await getAttendanceByKBMReport(kbmResult[0].id);

      expect(result).toHaveLength(1);
      expect(result[0].kbm_report_id).toBe(kbmResult[0].id);
      expect(result[0].generus_name).toBe('Test Generus');
      expect(result[0].status).toBe('present');
    });

    it('should return empty array for non-existent KBM report', async () => {
      const result = await getAttendanceByKBMReport(999);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAttendanceByGenerus', () => {
    it('should get attendance records by generus', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      const kbmResult = await db.insert(kbmReportsTable).values({
        ...testKBMReport,
        teacher_id: teacherResult[0].id
      }).returning().execute();

      // Create multiple attendance records
      await db.insert(attendanceTable).values([
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'present'
        },
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'absent'
        }
      ]).execute();

      const result = await getAttendanceByGenerus(generusResult[0].id);

      expect(result).toHaveLength(2);
      expect(result.every(r => r.generus_id === generusResult[0].id)).toBe(true);
    });
  });

  describe('getOnlineAttendanceBySambungGroup', () => {
    it('should get online attendance by sambung group', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();

      await db.insert(onlineAttendanceTable).values({
        generus_id: generusResult[0].id,
        generus_barcode: 'TEST123456',
        teacher_id: teacherResult[0].id,
        sambung_group: 'Group A'
      }).execute();

      const result = await getOnlineAttendanceBySambungGroup('Group A');

      expect(result).toHaveLength(1);
      expect(result[0].sambung_group).toBe('Group A');
      expect(result[0].generus_name).toBe('Test Generus');
      expect(result[0].generus_barcode).toBe('TEST123456');
    });
  });

  describe('getGenerusAttendanceStats', () => {
    it('should calculate attendance statistics correctly', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      const kbmResult = await db.insert(kbmReportsTable).values({
        ...testKBMReport,
        teacher_id: teacherResult[0].id
      }).returning().execute();

      // Create attendance records with different statuses
      await db.insert(attendanceTable).values([
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'present'
        },
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'present'
        },
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'sick'
        },
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'absent'
        }
      ]).execute();

      const result = await getGenerusAttendanceStats(generusResult[0].id);

      expect(result.generus_id).toBe(generusResult[0].id);
      expect(result.total_sessions).toBe(4);
      expect(result.present_count).toBe(2);
      expect(result.sick_count).toBe(1);
      expect(result.permitted_count).toBe(0);
      expect(result.absent_count).toBe(1);
      expect(result.attendance_percentage).toBe(50); // 2/4 = 50%
    });

    it('should handle generus with no attendance records', async () => {
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();

      const result = await getGenerusAttendanceStats(generusResult[0].id);

      expect(result.generus_id).toBe(generusResult[0].id);
      expect(result.total_sessions).toBe(0);
      expect(result.present_count).toBe(0);
      expect(result.attendance_percentage).toBe(0);
    });
  });

  describe('getAttendanceSummary', () => {
    it('should return attendance summary', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      const kbmResult = await db.insert(kbmReportsTable).values({
        ...testKBMReport,
        teacher_id: teacherResult[0].id
      }).returning().execute();

      // Create attendance records
      await db.insert(attendanceTable).values([
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'present'
        },
        {
          kbm_report_id: kbmResult[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'absent'
        }
      ]).execute();

      const result = await getAttendanceSummary();

      expect(result.total_attendance_records).toBe(2);
      expect(result.average_attendance_rate).toBe(50); // 1 present out of 2 total = 50%
      expect(Array.isArray(result.monthly_attendance)).toBe(true);
    });
  });

  describe('getAttendanceByDateRange', () => {
    it('should get attendance within date range', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      
      const kbmResult1 = await db.insert(kbmReportsTable).values({
        ...testKBMReport,
        day_date: new Date('2024-01-15'),
        teacher_id: teacherResult[0].id
      }).returning().execute();

      const kbmResult2 = await db.insert(kbmReportsTable).values({
        ...testKBMReport,
        day_date: new Date('2024-01-25'),
        teacher_id: teacherResult[0].id
      }).returning().execute();

      // Create attendance records
      await db.insert(attendanceTable).values([
        {
          kbm_report_id: kbmResult1[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'present'
        },
        {
          kbm_report_id: kbmResult2[0].id,
          generus_id: generusResult[0].id,
          generus_name: 'Test Generus',
          status: 'absent'
        }
      ]).execute();

      const result = await getAttendanceByDateRange(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      expect(result).toHaveLength(1);
      expect(result[0].kbm_report_id).toBe(kbmResult1[0].id);
    });
  });

  describe('updateAttendanceStatus', () => {
    it('should update attendance status successfully', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();
      const kbmResult = await db.insert(kbmReportsTable).values({
        ...testKBMReport,
        teacher_id: teacherResult[0].id
      }).returning().execute();

      const attendanceResult = await db.insert(attendanceTable).values({
        kbm_report_id: kbmResult[0].id,
        generus_id: generusResult[0].id,
        generus_name: 'Test Generus',
        status: 'absent'
      }).returning().execute();

      const result = await updateAttendanceStatus(attendanceResult[0].id, 'present');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Attendance status updated successfully');

      // Verify update
      const updated = await db.select()
        .from(attendanceTable)
        .where(eq(attendanceTable.id, attendanceResult[0].id))
        .execute();

      expect(updated[0].status).toBe('present');
    });
  });

  describe('getAllOnlineAttendance', () => {
    it('should get all online attendance records', async () => {
      // Create prerequisite data
      const teacherResult = await db.insert(teachersTable).values(testTeacher).returning().execute();
      const generusResult = await db.insert(generusTable).values(testGenerus).returning().execute();

      await db.insert(onlineAttendanceTable).values({
        generus_id: generusResult[0].id,
        generus_barcode: 'TEST123456',
        teacher_id: teacherResult[0].id,
        sambung_group: 'Group A'
      }).execute();

      const result = await getAllOnlineAttendance();

      expect(result).toHaveLength(1);
      expect(result[0].generus_name).toBe('Test Generus');
      expect(result[0].generus_level).toBe('remaja');
      expect(result[0].sambung_group).toBe('Group A');
    });

    it('should return empty array when no online attendance exists', async () => {
      const result = await getAllOnlineAttendance();
      expect(result).toHaveLength(0);
    });
  });
});