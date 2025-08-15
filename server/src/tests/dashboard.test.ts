import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  teachersTable, 
  coordinatorsTable, 
  generusTable, 
  kbmReportsTable, 
  attendanceTable,
  testingTable,
  onlineAttendanceTable
} from '../db/schema';
import {
  getDashboardStats,
  getMonthlyAttendanceData,
  getTeacherDashboardStats,
  getGenerusDashboardStats,
  getRecentActivities,
  getSystemHealth
} from '../handlers/dashboard';

describe('Dashboard Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test data
  const createTestData = async () => {
    // Create test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        name: 'Test Teacher',
        email: 'teacher@test.com',
        username: 'teacher1',
        password_hash: 'hashed_password',
        is_active: true
      })
      .returning()
      .execute();
    const teacher = teacherResult[0];

    // Create test coordinator
    const coordinatorResult = await db.insert(coordinatorsTable)
      .values({
        name: 'Test Coordinator',
        access_code: 'CODE123',
        is_active: true
      })
      .returning()
      .execute();
    const coordinator = coordinatorResult[0];

    // Create test generus
    const generusResult = await db.insert(generusTable)
      .values({
        full_name: 'Test Generus',
        sambung_group: 'Group A',
        level: 'remaja',
        gender: 'male',
        is_active: true,
        barcode: 'GEN001'
      })
      .returning()
      .execute();
    const generus = generusResult[0];

    // Create another generus for variety
    const generus2Result = await db.insert(generusTable)
      .values({
        full_name: 'Test Generus 2',
        sambung_group: 'Group B',
        level: 'pra-remaja',
        gender: 'female',
        is_active: true,
        barcode: 'GEN002'
      })
      .returning()
      .execute();
    const generus2 = generus2Result[0];

    return { teacher, coordinator, generus, generus2 };
  };

  const createKBMReportWithAttendance = async (teacherId: number, generusId: number) => {
    // Create KBM report
    const kbmReportResult = await db.insert(kbmReportsTable)
      .values({
        day_date: new Date(),
        sambung_group: 'Group A',
        teacher_id: teacherId,
        teacher_name: 'Test Teacher',
        level: 'remaja',
        material: 'Test Material'
      })
      .returning()
      .execute();
    const kbmReport = kbmReportResult[0];

    // Create attendance record
    await db.insert(attendanceTable)
      .values({
        kbm_report_id: kbmReport.id,
        generus_id: generusId,
        generus_name: 'Test Generus',
        status: 'present'
      })
      .execute();

    return kbmReport;
  };

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const { teacher, generus } = await createTestData();

      // Create test data
      await createKBMReportWithAttendance(teacher.id, generus.id);

      const stats = await getDashboardStats();

      expect(stats.total_reports).toEqual(1);
      expect(stats.this_month_reports).toEqual(1);
      expect(stats.average_attendance).toEqual(100); // 1 present out of 1 total
      expect(stats.active_teachers).toEqual(1);
      expect(stats.total_generus).toEqual(2); // We created 2 generus
      expect(stats.active_generus).toEqual(2);
    });

    it('should handle empty database', async () => {
      const stats = await getDashboardStats();

      expect(stats.total_reports).toEqual(0);
      expect(stats.average_attendance).toEqual(0);
      expect(stats.active_teachers).toEqual(0);
      expect(stats.this_month_reports).toEqual(0);
      expect(stats.total_generus).toEqual(0);
      expect(stats.active_generus).toEqual(0);
    });

    it('should calculate attendance percentage correctly', async () => {
      const { teacher, generus, generus2 } = await createTestData();

      // Create KBM report
      const kbmReportResult = await db.insert(kbmReportsTable)
        .values({
          day_date: new Date(),
          sambung_group: 'Group A',
          teacher_id: teacher.id,
          teacher_name: 'Test Teacher',
          level: 'remaja',
          material: 'Test Material'
        })
        .returning()
        .execute();
      const kbmReport = kbmReportResult[0];

      // Create attendance records - 2 present, 1 absent
      await db.insert(attendanceTable)
        .values([
          {
            kbm_report_id: kbmReport.id,
            generus_id: generus.id,
            generus_name: 'Test Generus',
            status: 'present'
          },
          {
            kbm_report_id: kbmReport.id,
            generus_id: generus2.id,
            generus_name: 'Test Generus 2',
            status: 'present'
          },
          {
            kbm_report_id: kbmReport.id,
            generus_id: generus.id,
            generus_name: 'Test Generus',
            status: 'absent'
          }
        ])
        .execute();

      const stats = await getDashboardStats();

      // 2 present out of 3 total = 67% (rounded)
      expect(stats.average_attendance).toEqual(67);
    });
  });

  describe('getMonthlyAttendanceData', () => {
    it('should return monthly attendance data for current year', async () => {
      const data = await getMonthlyAttendanceData();

      expect(data).toHaveLength(12);
      expect(data[0].month).toEqual('Jan');
      expect(data[11].month).toEqual('Dec');
      
      // Initially all should be 0
      data.forEach(month => {
        expect(month.generus_attendance).toEqual(0);
        expect(month.teacher_attendance).toEqual(0);
      });
    });

    it('should return data with attendance when available', async () => {
      const { teacher, generus } = await createTestData();

      // Create KBM report and attendance for current month
      await createKBMReportWithAttendance(teacher.id, generus.id);

      const currentYear = new Date().getFullYear();
      const data = await getMonthlyAttendanceData(currentYear);
      const currentMonth = new Date().getMonth(); // 0-based index

      expect(data[currentMonth].generus_attendance).toEqual(1);
      expect(data[currentMonth].teacher_attendance).toEqual(1);
    });

    it('should return data for specific year', async () => {
      const data = await getMonthlyAttendanceData(2023);

      expect(data).toHaveLength(12);
      // Should be all zeros for 2023 since we have no data for that year
      data.forEach(month => {
        expect(month.generus_attendance).toEqual(0);
        expect(month.teacher_attendance).toEqual(0);
      });
    });
  });

  describe('getTeacherDashboardStats', () => {
    it('should return teacher-specific statistics', async () => {
      const { teacher, generus } = await createTestData();

      // Create test data for the teacher
      await createKBMReportWithAttendance(teacher.id, generus.id);

      const stats = await getTeacherDashboardStats(teacher.id);

      expect(stats.my_reports).toEqual(1);
      expect(stats.this_month_my_reports).toEqual(1);
      expect(stats.my_attendance_records).toEqual(1);
      expect(stats.active_generus_in_groups).toEqual(1); // 1 generus in Group A
    });

    it('should return zeros for teacher with no activity', async () => {
      const { teacher } = await createTestData();

      const stats = await getTeacherDashboardStats(teacher.id);

      expect(stats.my_reports).toEqual(0);
      expect(stats.this_month_my_reports).toEqual(0);
      expect(stats.my_attendance_records).toEqual(0);
      expect(stats.active_generus_in_groups).toEqual(0);
    });

    it('should count generus in multiple groups correctly', async () => {
      const { teacher, generus, generus2 } = await createTestData();

      // Create reports for both groups
      await db.insert(kbmReportsTable)
        .values([
          {
            day_date: new Date(),
            sambung_group: 'Group A',
            teacher_id: teacher.id,
            teacher_name: 'Test Teacher',
            level: 'remaja',
            material: 'Material A'
          },
          {
            day_date: new Date(),
            sambung_group: 'Group B',
            teacher_id: teacher.id,
            teacher_name: 'Test Teacher',
            level: 'pra-remaja',
            material: 'Material B'
          }
        ])
        .execute();

      const stats = await getTeacherDashboardStats(teacher.id);

      expect(stats.my_reports).toEqual(2);
      expect(stats.active_generus_in_groups).toEqual(2); // Both generus in teacher's groups
    });
  });

  describe('getGenerusDashboardStats', () => {
    it('should return generus-specific statistics', async () => {
      const { teacher, generus } = await createTestData();

      // Create attendance and test data
      const kbmReport = await createKBMReportWithAttendance(teacher.id, generus.id);

      // Create test score
      await db.insert(testingTable)
        .values({
          generus_id: generus.id,
          test_type: 'alquran',
          score: '85.5',
          teacher_id: teacher.id
        })
        .execute();

      const stats = await getGenerusDashboardStats(generus.id);

      expect(stats.total_sessions_attended).toEqual(1);
      expect(stats.my_attendance_rate).toEqual(100); // 1 present out of 1 total
      expect(stats.total_tests_taken).toEqual(1);
      expect(stats.test_scores_average).toEqual(85.5);
    });

    it('should calculate attendance rate correctly', async () => {
      const { teacher, generus } = await createTestData();

      // Create KBM report
      const kbmReportResult = await db.insert(kbmReportsTable)
        .values({
          day_date: new Date(),
          sambung_group: 'Group A',
          teacher_id: teacher.id,
          teacher_name: 'Test Teacher',
          level: 'remaja',
          material: 'Test Material'
        })
        .returning()
        .execute();
      const kbmReport = kbmReportResult[0];

      // Create mixed attendance (2 present, 1 absent)
      await db.insert(attendanceTable)
        .values([
          {
            kbm_report_id: kbmReport.id,
            generus_id: generus.id,
            generus_name: 'Test Generus',
            status: 'present'
          },
          {
            kbm_report_id: kbmReport.id,
            generus_id: generus.id,
            generus_name: 'Test Generus',
            status: 'present'
          },
          {
            kbm_report_id: kbmReport.id,
            generus_id: generus.id,
            generus_name: 'Test Generus',
            status: 'absent'
          }
        ])
        .execute();

      const stats = await getGenerusDashboardStats(generus.id);

      expect(stats.total_sessions_attended).toEqual(2);
      expect(stats.my_attendance_rate).toEqual(67); // 2 present out of 3 total
    });

    it('should handle generus with no data', async () => {
      const { generus } = await createTestData();

      const stats = await getGenerusDashboardStats(generus.id);

      expect(stats.total_sessions_attended).toEqual(0);
      expect(stats.my_attendance_rate).toEqual(0);
      expect(stats.total_tests_taken).toEqual(0);
      expect(stats.test_scores_average).toEqual(0);
    });
  });

  describe('getRecentActivities', () => {
    it('should return recent activities', async () => {
      const { teacher, generus } = await createTestData();

      // Create KBM report
      await createKBMReportWithAttendance(teacher.id, generus.id);

      // Create online attendance
      await db.insert(onlineAttendanceTable)
        .values({
          generus_id: generus.id,
          generus_barcode: 'GEN001',
          teacher_id: teacher.id,
          sambung_group: 'Group A'
        })
        .execute();

      const activities = await getRecentActivities(10);

      expect(activities.length).toBeGreaterThan(0);
      expect(activities.length).toBeLessThanOrEqual(10);

      // Check structure of activities
      activities.forEach(activity => {
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('message');
        expect(activity).toHaveProperty('user');
        expect(activity).toHaveProperty('timestamp');
        expect(activity.timestamp).toBeInstanceOf(Date);
      });

      // Activities should be sorted by timestamp (newest first)
      if (activities.length > 1) {
        for (let i = 0; i < activities.length - 1; i++) {
          expect(activities[i].timestamp.getTime())
            .toBeGreaterThanOrEqual(activities[i + 1].timestamp.getTime());
        }
      }
    });

    it('should respect limit parameter', async () => {
      const { teacher, generus } = await createTestData();

      // Create multiple activities
      for (let i = 0; i < 5; i++) {
        await createKBMReportWithAttendance(teacher.id, generus.id);
      }

      const activities = await getRecentActivities(3);

      expect(activities.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array when no activities exist', async () => {
      const activities = await getRecentActivities();

      expect(activities).toEqual([]);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      const { teacher, coordinator, generus } = await createTestData();

      // Create some online attendance for active sessions simulation
      await db.insert(onlineAttendanceTable)
        .values({
          generus_id: generus.id,
          generus_barcode: 'GEN001',
          teacher_id: teacher.id,
          sambung_group: 'Group A'
        })
        .execute();

      const health = await getSystemHealth();

      expect(health.database_status).toEqual('healthy');
      expect(health.total_users).toEqual(4); // 1 teacher + 1 coordinator + 2 generus
      expect(health.active_sessions).toBeGreaterThanOrEqual(0);
      expect(health.last_backup).toBeNull(); // As implemented
    });

    it('should return database status as healthy when database is accessible', async () => {
      const health = await getSystemHealth();

      expect(health.database_status).toEqual('healthy');
      expect(typeof health.total_users).toBe('number');
      expect(typeof health.active_sessions).toBe('number');
    });

    it('should handle empty database correctly', async () => {
      const health = await getSystemHealth();

      expect(health.database_status).toEqual('healthy');
      expect(health.total_users).toEqual(0);
      expect(health.active_sessions).toEqual(0);
      expect(health.last_backup).toBeNull();
    });
  });
});