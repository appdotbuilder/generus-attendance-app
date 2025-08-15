import { db } from '../db';
import { attendanceTable, onlineAttendanceTable, generusTable, kbmReportsTable } from '../db/schema';
import { type Attendance, type OnlineAttendance, type GenerusAttendanceStats, type AttendanceStatus } from '../schema';
import { eq, and, between, gte, lte, sql, count, sum } from 'drizzle-orm';

// Record online attendance via barcode scan
export async function recordOnlineAttendance(input: { generusBarcode: string; teacherId: number }): Promise<{ success: boolean; message: string; generus?: any }> {
  try {
    // First, find the generus by barcode
    const generusResults = await db.select()
      .from(generusTable)
      .where(and(
        eq(generusTable.barcode, input.generusBarcode),
        eq(generusTable.is_active, true)
      ))
      .execute();

    if (generusResults.length === 0) {
      return {
        success: false,
        message: 'Generus not found or inactive'
      };
    }

    const generus = generusResults[0];

    // Check if attendance already recorded today for this generus and teacher
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await db.select()
      .from(onlineAttendanceTable)
      .where(and(
        eq(onlineAttendanceTable.generus_id, generus.id),
        eq(onlineAttendanceTable.teacher_id, input.teacherId),
        gte(onlineAttendanceTable.created_at, today),
        lte(onlineAttendanceTable.created_at, tomorrow)
      ))
      .execute();

    if (existingAttendance.length > 0) {
      return {
        success: false,
        message: 'Attendance already recorded today for this generus',
        generus: generus
      };
    }

    // Record the online attendance
    await db.insert(onlineAttendanceTable)
      .values({
        generus_id: generus.id,
        generus_barcode: input.generusBarcode,
        teacher_id: input.teacherId,
        sambung_group: generus.sambung_group
      })
      .execute();

    return {
      success: true,
      message: 'Attendance recorded successfully',
      generus: generus
    };
  } catch (error) {
    console.error('Online attendance recording failed:', error);
    throw error;
  }
}

// Get attendance records by KBM report
export async function getAttendanceByKBMReport(kbmReportId: number): Promise<Attendance[]> {
  try {
    const results = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.kbm_report_id, kbmReportId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get attendance by KBM report failed:', error);
    throw error;
  }
}

// Get attendance records by generus
export async function getAttendanceByGenerus(generusId: number): Promise<Attendance[]> {
  try {
    const results = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.generus_id, generusId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get attendance by generus failed:', error);
    throw error;
  }
}

// Get online attendance records by sambung group
export async function getOnlineAttendanceBySambungGroup(sambungGroup: string): Promise<any[]> {
  try {
    const results = await db.select({
      id: onlineAttendanceTable.id,
      generus_id: onlineAttendanceTable.generus_id,
      generus_barcode: onlineAttendanceTable.generus_barcode,
      teacher_id: onlineAttendanceTable.teacher_id,
      sambung_group: onlineAttendanceTable.sambung_group,
      created_at: onlineAttendanceTable.created_at,
      generus_name: generusTable.full_name
    })
      .from(onlineAttendanceTable)
      .innerJoin(generusTable, eq(onlineAttendanceTable.generus_id, generusTable.id))
      .where(eq(onlineAttendanceTable.sambung_group, sambungGroup))
      .execute();

    return results;
  } catch (error) {
    console.error('Get online attendance by sambung group failed:', error);
    throw error;
  }
}

// Get generus attendance statistics
export async function getGenerusAttendanceStats(generusId: number): Promise<GenerusAttendanceStats> {
  try {
    const stats = await db.select({
      total_sessions: count(attendanceTable.id),
      present_count: sum(sql`CASE WHEN ${attendanceTable.status} = 'present' THEN 1 ELSE 0 END`),
      sick_count: sum(sql`CASE WHEN ${attendanceTable.status} = 'sick' THEN 1 ELSE 0 END`),
      permitted_count: sum(sql`CASE WHEN ${attendanceTable.status} = 'permitted' THEN 1 ELSE 0 END`),
      absent_count: sum(sql`CASE WHEN ${attendanceTable.status} = 'absent' THEN 1 ELSE 0 END`)
    })
      .from(attendanceTable)
      .where(eq(attendanceTable.generus_id, generusId))
      .execute();

    const result = stats[0];
    const totalSessions = Number(result.total_sessions);
    const presentCount = Number(result.present_count) || 0;
    const sickCount = Number(result.sick_count) || 0;
    const permittedCount = Number(result.permitted_count) || 0;
    const absentCount = Number(result.absent_count) || 0;

    const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    return {
      generus_id: generusId,
      total_sessions: totalSessions,
      present_count: presentCount,
      sick_count: sickCount,
      permitted_count: permittedCount,
      absent_count: absentCount,
      attendance_percentage: Math.round(attendancePercentage * 100) / 100 // Round to 2 decimal places
    };
  } catch (error) {
    console.error('Get generus attendance stats failed:', error);
    throw error;
  }
}

// Get attendance summary for dashboard
export async function getAttendanceSummary(): Promise<{
  total_attendance_records: number;
  average_attendance_rate: number;
  monthly_attendance: any[];
}> {
  try {
    // Get total attendance records
    const totalRecords = await db.select({ count: count(attendanceTable.id) })
      .from(attendanceTable)
      .execute();

    // Get present records count
    const presentRecords = await db.select({ count: count(attendanceTable.id) })
      .from(attendanceTable)
      .where(eq(attendanceTable.status, 'present'))
      .execute();

    const totalCount = Number(totalRecords[0].count);
    const presentCount = Number(presentRecords[0].count);
    const averageRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

    // Get monthly attendance data (last 6 months) using regular select query
    const monthlyData = await db.select({
      month: sql<string>`TO_CHAR(${attendanceTable.created_at}, 'YYYY-MM')`,
      total_records: count(attendanceTable.id),
      present_records: sum(sql`CASE WHEN ${attendanceTable.status} = 'present' THEN 1 ELSE 0 END`)
    })
      .from(attendanceTable)
      .where(sql`${attendanceTable.created_at} >= NOW() - INTERVAL '6 months'`)
      .groupBy(sql`TO_CHAR(${attendanceTable.created_at}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${attendanceTable.created_at}, 'YYYY-MM') DESC`)
      .execute();

    const monthlyAttendance = monthlyData.map(row => ({
      month: row.month,
      total_records: Number(row.total_records),
      present_records: Number(row.present_records) || 0,
      attendance_rate: row.total_records > 0 ? ((Number(row.present_records) || 0) / Number(row.total_records)) * 100 : 0
    }));

    return {
      total_attendance_records: totalCount,
      average_attendance_rate: Math.round(averageRate * 100) / 100,
      monthly_attendance: monthlyAttendance
    };
  } catch (error) {
    console.error('Get attendance summary failed:', error);
    throw error;
  }
}

// Get attendance by date range
export async function getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<Attendance[]> {
  try {
    const results = await db.select()
      .from(attendanceTable)
      .innerJoin(kbmReportsTable, eq(attendanceTable.kbm_report_id, kbmReportsTable.id))
      .where(and(
        gte(kbmReportsTable.day_date, startDate),
        lte(kbmReportsTable.day_date, endDate)
      ))
      .execute();

    return results.map(result => result.attendance);
  } catch (error) {
    console.error('Get attendance by date range failed:', error);
    throw error;
  }
}

// Update attendance status
export async function updateAttendanceStatus(attendanceId: number, status: AttendanceStatus): Promise<{ success: boolean; message: string }> {
  try {
    const result = await db.update(attendanceTable)
      .set({ status: status })
      .where(eq(attendanceTable.id, attendanceId))
      .execute();

    return {
      success: true,
      message: 'Attendance status updated successfully'
    };
  } catch (error) {
    console.error('Update attendance status failed:', error);
    throw error;
  }
}

// Get all online attendance records
export async function getAllOnlineAttendance(): Promise<any[]> {
  try {
    const results = await db.select({
      id: onlineAttendanceTable.id,
      generus_id: onlineAttendanceTable.generus_id,
      generus_barcode: onlineAttendanceTable.generus_barcode,
      teacher_id: onlineAttendanceTable.teacher_id,
      sambung_group: onlineAttendanceTable.sambung_group,
      created_at: onlineAttendanceTable.created_at,
      generus_name: generusTable.full_name,
      generus_level: generusTable.level
    })
      .from(onlineAttendanceTable)
      .innerJoin(generusTable, eq(onlineAttendanceTable.generus_id, generusTable.id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get all online attendance failed:', error);
    throw error;
  }
}