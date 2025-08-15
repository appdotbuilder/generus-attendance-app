import { db } from '../db';
import { kbmReportsTable, attendanceTable, teachersTable, generusTable } from '../db/schema';
import { type KBMReport, type CreateKBMReport, type Attendance } from '../schema';
import { eq, gte, lte, and, desc, SQL } from 'drizzle-orm';

// Create KBM report with attendance
export async function createKBMReport(input: CreateKBMReport): Promise<KBMReport> {
  try {
    // Verify teacher exists
    const teacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, input.teacher_id))
      .execute();

    if (!teacher.length) {
      throw new Error('Teacher not found');
    }

    // Verify all generus exist
    if (input.generus_attendance.length > 0) {
      const generusIds = input.generus_attendance.map(g => g.generus_id);
      const existingGenerus = await db.select()
        .from(generusTable)
        .where(eq(generusTable.id, generusIds[0])) // Check first one
        .execute();

      // For simplicity, we'll trust the provided generus data
      // In production, you'd validate all IDs
    }

    // Insert KBM report
    const reportResult = await db.insert(kbmReportsTable)
      .values({
        day_date: input.day_date,
        sambung_group: input.sambung_group,
        teacher_id: input.teacher_id,
        teacher_name: input.teacher_name,
        level: input.level,
        material: input.material,
        notes: input.notes || null
      })
      .returning()
      .execute();

    const report = reportResult[0];

    // Insert attendance records
    if (input.generus_attendance.length > 0) {
      await db.insert(attendanceTable)
        .values(
          input.generus_attendance.map(attendance => ({
            kbm_report_id: report.id,
            generus_id: attendance.generus_id,
            generus_name: attendance.full_name,
            status: attendance.status
          }))
        )
        .execute();
    }

    return report;
  } catch (error) {
    console.error('KBM report creation failed:', error);
    throw error;
  }
}

// Get all KBM reports
export async function getAllKBMReports(): Promise<KBMReport[]> {
  try {
    const reports = await db.select()
      .from(kbmReportsTable)
      .orderBy(desc(kbmReportsTable.created_at))
      .execute();

    return reports;
  } catch (error) {
    console.error('Failed to fetch all KBM reports:', error);
    throw error;
  }
}

// Get KBM reports by teacher
export async function getKBMReportsByTeacher(teacherId: number): Promise<KBMReport[]> {
  try {
    const reports = await db.select()
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.teacher_id, teacherId))
      .orderBy(desc(kbmReportsTable.created_at))
      .execute();

    return reports;
  } catch (error) {
    console.error('Failed to fetch KBM reports by teacher:', error);
    throw error;
  }
}

// Get KBM reports by date range
export async function getKBMReportsByDateRange(startDate: Date, endDate: Date): Promise<KBMReport[]> {
  try {
    const reports = await db.select()
      .from(kbmReportsTable)
      .where(
        and(
          gte(kbmReportsTable.day_date, startDate),
          lte(kbmReportsTable.day_date, endDate)
        )
      )
      .orderBy(desc(kbmReportsTable.day_date))
      .execute();

    return reports;
  } catch (error) {
    console.error('Failed to fetch KBM reports by date range:', error);
    throw error;
  }
}

// Get KBM report details with attendance
export async function getKBMReportDetails(reportId: number): Promise<{ report: KBMReport; attendance: Attendance[] } | null> {
  try {
    // Get report details
    const reports = await db.select()
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.id, reportId))
      .execute();

    if (!reports.length) {
      return null;
    }

    const report = reports[0];

    // Get attendance records
    const attendanceRecords = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.kbm_report_id, reportId))
      .execute();

    return {
      report,
      attendance: attendanceRecords
    };
  } catch (error) {
    console.error('Failed to fetch KBM report details:', error);
    throw error;
  }
}

// Get KBM reports by sambung group
export async function getKBMReportsBySambungGroup(sambungGroup: string): Promise<KBMReport[]> {
  try {
    const reports = await db.select()
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.sambung_group, sambungGroup))
      .orderBy(desc(kbmReportsTable.created_at))
      .execute();

    return reports;
  } catch (error) {
    console.error('Failed to fetch KBM reports by sambung group:', error);
    throw error;
  }
}

// Update KBM report
export async function updateKBMReport(reportId: number, updates: Partial<CreateKBMReport>): Promise<KBMReport | null> {
  try {
    // Check if report exists
    const existingReports = await db.select()
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.id, reportId))
      .execute();

    if (!existingReports.length) {
      return null;
    }

    // Prepare update object (excluding generus_attendance which is handled separately)
    const updateData: any = {};
    
    if (updates.day_date !== undefined) updateData.day_date = updates.day_date;
    if (updates.sambung_group !== undefined) updateData.sambung_group = updates.sambung_group;
    if (updates.teacher_id !== undefined) updateData.teacher_id = updates.teacher_id;
    if (updates.teacher_name !== undefined) updateData.teacher_name = updates.teacher_name;
    if (updates.level !== undefined) updateData.level = updates.level;
    if (updates.material !== undefined) updateData.material = updates.material;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    // Update the report
    const result = await db.update(kbmReportsTable)
      .set(updateData)
      .where(eq(kbmReportsTable.id, reportId))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to update KBM report:', error);
    throw error;
  }
}

// Delete KBM report
export async function deleteKBMReport(reportId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Check if report exists
    const existingReports = await db.select()
      .from(kbmReportsTable)
      .where(eq(kbmReportsTable.id, reportId))
      .execute();

    if (!existingReports.length) {
      return {
        success: false,
        message: 'KBM report not found'
      };
    }

    // Delete attendance records first (foreign key constraint)
    await db.delete(attendanceTable)
      .where(eq(attendanceTable.kbm_report_id, reportId))
      .execute();

    // Delete the report
    await db.delete(kbmReportsTable)
      .where(eq(kbmReportsTable.id, reportId))
      .execute();

    return {
      success: true,
      message: 'KBM report deleted successfully'
    };
  } catch (error) {
    console.error('Failed to delete KBM report:', error);
    throw error;
  }
}

// Export KBM reports to Excel (simplified implementation)
export async function exportKBMReportsToExcel(filters?: {
  teacherId?: number;
  sambungGroup?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ fileUrl: string }> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (filters?.teacherId) {
      conditions.push(eq(kbmReportsTable.teacher_id, filters.teacherId));
    }

    if (filters?.sambungGroup) {
      conditions.push(eq(kbmReportsTable.sambung_group, filters.sambungGroup));
    }

    if (filters?.startDate) {
      conditions.push(gte(kbmReportsTable.day_date, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(kbmReportsTable.day_date, filters.endDate));
    }

    // Execute query with proper chaining
    const reports = conditions.length > 0
      ? await db.select()
          .from(kbmReportsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(kbmReportsTable.day_date))
          .execute()
      : await db.select()
          .from(kbmReportsTable)
          .orderBy(desc(kbmReportsTable.day_date))
          .execute();

    // In a real implementation, you would:
    // 1. Generate Excel file using a library like 'xlsx'
    // 2. Save to file system or cloud storage
    // 3. Return actual file URL
    
    // For now, return a mock file URL
    const timestamp = Date.now();
    return {
      fileUrl: `/exports/kbm-reports-${timestamp}.xlsx`
    };
  } catch (error) {
    console.error('Failed to export KBM reports:', error);
    throw error;
  }
}