import { db } from '../db';
import { 
  kbmReportsTable, 
  attendanceTable, 
  teachersTable, 
  generusTable,
  testingTable,
  onlineAttendanceTable,
  coordinatorsTable,
  materialInfoTable,
  criticismSuggestionsTable
} from '../db/schema';
import { type DashboardStats, type MonthlyAttendance } from '../schema';
import { count, avg, eq, gte, and, sql, desc, between } from 'drizzle-orm';

// Get dashboard statistics for teacher/coordinator
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get current date for month calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total reports
    const totalReportsResult = await db.select({ count: count() })
      .from(kbmReportsTable)
      .execute();
    const total_reports = totalReportsResult[0]?.count || 0;

    // Get this month's reports
    const thisMonthReportsResult = await db.select({ count: count() })
      .from(kbmReportsTable)
      .where(gte(kbmReportsTable.created_at, startOfMonth))
      .execute();
    const this_month_reports = thisMonthReportsResult[0]?.count || 0;

    // Get average attendance percentage
    const attendanceStatsResult = await db.select({
      total: count(),
      present: count(sql`CASE WHEN ${attendanceTable.status} = 'present' THEN 1 END`)
    })
      .from(attendanceTable)
      .execute();
    
    const attendanceStats = attendanceStatsResult[0];
    const average_attendance = attendanceStats?.total > 0 
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

    // Get active teachers count
    const activeTeachersResult = await db.select({ count: count() })
      .from(teachersTable)
      .where(eq(teachersTable.is_active, true))
      .execute();
    const active_teachers = activeTeachersResult[0]?.count || 0;

    // Get total generus count
    const totalGenerusResult = await db.select({ count: count() })
      .from(generusTable)
      .execute();
    const total_generus = totalGenerusResult[0]?.count || 0;

    // Get active generus count
    const activeGenerusResult = await db.select({ count: count() })
      .from(generusTable)
      .where(eq(generusTable.is_active, true))
      .execute();
    const active_generus = activeGenerusResult[0]?.count || 0;

    return {
      total_reports,
      average_attendance,
      active_teachers,
      this_month_reports,
      total_generus,
      active_generus
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}

// Get monthly attendance data for charts
export async function getMonthlyAttendanceData(year?: number): Promise<MonthlyAttendance[]> {
  try {
    const currentYear = year || new Date().getFullYear();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Get all attendance records for the year - without any complex filtering first
    const allAttendanceResult = await db.select({
      created_at: attendanceTable.created_at
    })
      .from(attendanceTable)
      .execute();

    // Get all KBM reports for the year
    const allReportsResult = await db.select({
      created_at: kbmReportsTable.created_at
    })
      .from(kbmReportsTable)
      .execute();

    // Process the data in JavaScript to avoid SQL complexity
    const monthlyAttendance = new Map<number, number>();
    const monthlyReports = new Map<number, number>();

    // Count attendance by month
    allAttendanceResult.forEach(record => {
      if (record.created_at.getFullYear() === currentYear) {
        const month = record.created_at.getMonth() + 1; // 1-based for consistency
        monthlyAttendance.set(month, (monthlyAttendance.get(month) || 0) + 1);
      }
    });

    // Count reports by month
    allReportsResult.forEach(record => {
      if (record.created_at.getFullYear() === currentYear) {
        const month = record.created_at.getMonth() + 1; // 1-based for consistency
        monthlyReports.set(month, (monthlyReports.get(month) || 0) + 1);
      }
    });

    // Build result array with all 12 months
    return months.map((month, index) => ({
      month,
      generus_attendance: monthlyAttendance.get(index + 1) || 0,
      teacher_attendance: monthlyReports.get(index + 1) || 0
    }));
  } catch (error) {
    console.error('Monthly attendance data retrieval failed:', error);
    throw error;
  }
}

// Get teacher-specific dashboard stats
export async function getTeacherDashboardStats(teacherId: number): Promise<{
  my_reports: number;
  my_attendance_records: number;
  active_generus_in_groups: number;
  this_month_my_reports: number;
}> {
  try {
    // Get current date for month calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get teacher's total reports
    const myReportsResult = await db.select({ count: count() })
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.teacher_id, teacherId))
      .execute();
    const my_reports = myReportsResult[0]?.count || 0;

    // Get teacher's this month reports
    const thisMonthReportsResult = await db.select({ count: count() })
      .from(kbmReportsTable)
      .where(and(
        eq(kbmReportsTable.teacher_id, teacherId),
        gte(kbmReportsTable.created_at, startOfMonth)
      ))
      .execute();
    const this_month_my_reports = thisMonthReportsResult[0]?.count || 0;

    // Get teacher's attendance records count
    const attendanceRecordsResult = await db.select({ count: count() })
      .from(attendanceTable)
      .innerJoin(kbmReportsTable, eq(attendanceTable.kbm_report_id, kbmReportsTable.id))
      .where(eq(kbmReportsTable.teacher_id, teacherId))
      .execute();
    const my_attendance_records = attendanceRecordsResult[0]?.count || 0;

    // Get active generus in teacher's groups
    // First get teacher's sambung groups
    const teacherGroupsResult = await db.select({ 
      sambung_group: kbmReportsTable.sambung_group 
    })
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.teacher_id, teacherId))
      .groupBy(kbmReportsTable.sambung_group)
      .execute();

    let active_generus_in_groups = 0;
    if (teacherGroupsResult.length > 0) {
      const groups = teacherGroupsResult.map(row => row.sambung_group);
      
      // Use OR conditions to find generus in any of teacher's groups
      const conditions = groups.map(group => eq(generusTable.sambung_group, group));
      
      const activeGenerusResult = await db.select({ count: count() })
        .from(generusTable)
        .where(and(
          eq(generusTable.is_active, true),
          conditions.length === 1 ? conditions[0] : sql`(${sql.join(conditions, sql` OR `)})`
        ))
        .execute();
      
      active_generus_in_groups = activeGenerusResult[0]?.count || 0;
    }

    return {
      my_reports,
      my_attendance_records,
      active_generus_in_groups,
      this_month_my_reports
    };
  } catch (error) {
    console.error('Teacher dashboard stats retrieval failed:', error);
    throw error;
  }
}

// Get generus dashboard stats
export async function getGenerusDashboardStats(generusId: number): Promise<{
  my_attendance_rate: number;
  total_sessions_attended: number;
  test_scores_average: number;
  total_tests_taken: number;
}> {
  try {
    // Get attendance statistics
    const attendanceStatsResult = await db.select({
      total: count(),
      present: count(sql`CASE WHEN ${attendanceTable.status} = 'present' THEN 1 END`)
    })
      .from(attendanceTable)
      .where(eq(attendanceTable.generus_id, generusId))
      .execute();

    const attendanceStats = attendanceStatsResult[0];
    const total_sessions_attended = attendanceStats?.present || 0;
    const my_attendance_rate = attendanceStats?.total > 0 
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

    // Get test statistics
    const testStatsResult = await db.select({
      count: count(),
      average: avg(testingTable.score)
    })
      .from(testingTable)
      .where(eq(testingTable.generus_id, generusId))
      .execute();

    const testStats = testStatsResult[0];
    const total_tests_taken = testStats?.count || 0;
    const test_scores_average = testStats?.average ? parseFloat(testStats.average) : 0;

    return {
      my_attendance_rate,
      total_sessions_attended,
      test_scores_average: Math.round(test_scores_average * 100) / 100, // Round to 2 decimal places
      total_tests_taken
    };
  } catch (error) {
    console.error('Generus dashboard stats retrieval failed:', error);
    throw error;
  }
}

// Get recent activities for dashboard
export async function getRecentActivities(limit: number = 10): Promise<{
  type: string;
  message: string;
  user: string;
  timestamp: Date;
}[]> {
  try {
    const activities: {
      type: string;
      message: string;
      user: string;
      timestamp: Date;
    }[] = [];

    // Get recent KBM reports
    const recentReportsResult = await db.select({
      teacher_name: kbmReportsTable.teacher_name,
      sambung_group: kbmReportsTable.sambung_group,
      material: kbmReportsTable.material,
      created_at: kbmReportsTable.created_at
    })
      .from(kbmReportsTable)
      .orderBy(desc(kbmReportsTable.created_at))
      .limit(Math.floor(limit / 2))
      .execute();

    recentReportsResult.forEach(report => {
      activities.push({
        type: 'kbm_report',
        message: `Created KBM report for ${report.sambung_group} - ${report.material}`,
        user: report.teacher_name,
        timestamp: report.created_at
      });
    });

    // Get recent online attendance
    const recentOnlineAttendanceResult = await db.select({
      generus_barcode: onlineAttendanceTable.generus_barcode,
      sambung_group: onlineAttendanceTable.sambung_group,
      created_at: onlineAttendanceTable.created_at
    })
      .from(onlineAttendanceTable)
      .innerJoin(generusTable, eq(onlineAttendanceTable.generus_id, generusTable.id))
      .orderBy(desc(onlineAttendanceTable.created_at))
      .limit(Math.floor(limit / 2))
      .execute();

    recentOnlineAttendanceResult.forEach(attendance => {
      const result = attendance as any;
      activities.push({
        type: 'online_attendance',
        message: `Online attendance recorded for ${result.sambung_group}`,
        user: `Generus (${result.generus_barcode})`,
        timestamp: result.created_at
      });
    });

    // Sort all activities by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Recent activities retrieval failed:', error);
    throw error;
  }
}

// Get system health status
export async function getSystemHealth(): Promise<{
  database_status: 'healthy' | 'warning' | 'error';
  total_users: number;
  active_sessions: number;
  last_backup: Date | null;
}> {
  try {
    // Get total users (teachers + coordinators + generus)
    const teachersCountResult = await db.select({ count: count() })
      .from(teachersTable)
      .execute();
    const teachersCount = teachersCountResult[0]?.count || 0;

    const coordinatorsCountResult = await db.select({ count: count() })
      .from(coordinatorsTable)
      .execute();
    const coordinatorsCount = coordinatorsCountResult[0]?.count || 0;

    const generusCountResult = await db.select({ count: count() })
      .from(generusTable)
      .execute();
    const generusCount = generusCountResult[0]?.count || 0;

    const total_users = teachersCount + coordinatorsCount + generusCount;

    // Check database health by performing a simple query
    let database_status: 'healthy' | 'warning' | 'error' = 'healthy';
    try {
      await db.select({ count: count() }).from(teachersTable).limit(1).execute();
    } catch (dbError) {
      database_status = 'error';
    }

    // For demonstration, calculate active sessions based on recent activity
    // In a real application, this would be tracked in a sessions table
    const recentThreshold = new Date();
    recentThreshold.setHours(recentThreshold.getHours() - 1); // Last hour

    const recentActivityResult = await db.select({ count: count() })
      .from(onlineAttendanceTable)
      .where(gte(onlineAttendanceTable.created_at, recentThreshold))
      .execute();
    const active_sessions = recentActivityResult[0]?.count || 0;

    // For demonstration purposes, last_backup is set to null
    // In a real application, this would be tracked separately
    const last_backup = null;

    return {
      database_status,
      total_users,
      active_sessions,
      last_backup
    };
  } catch (error) {
    console.error('System health check failed:', error);
    return {
      database_status: 'error',
      total_users: 0,
      active_sessions: 0,
      last_backup: null
    };
  }
}