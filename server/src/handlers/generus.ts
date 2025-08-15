import { db } from '../db';
import { generusTable } from '../db/schema';
import { type Generus, type GenerusDataInput, type UpdateGenerus } from '../schema';
import { eq, sql } from 'drizzle-orm';

// Get all generus (for teacher/coordinator dashboards)
export async function getAllGenerus(): Promise<Generus[]> {
  try {
    const results = await db.select()
      .from(generusTable)
      .where(eq(generusTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all generus:', error);
    throw error;
  }
}

// Get generus by ID
export async function getGenerusById(generusId: number): Promise<Generus | null> {
  try {
    const results = await db.select()
      .from(generusTable)
      .where(eq(generusTable.id, generusId))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch generus by ID:', error);
    throw error;
  }
}

// Get generus by barcode
export async function getGenerusByBarcode(barcode: string): Promise<Generus | null> {
  try {
    const results = await db.select()
      .from(generusTable)
      .where(eq(generusTable.barcode, barcode))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch generus by barcode:', error);
    throw error;
  }
}

// Create or update generus data (from generus dashboard input)
export async function createOrUpdateGenerusData(input: GenerusDataInput): Promise<Generus> {
  try {
    // Check if generus exists by full_name and sambung_group combination
    const existingGenerus = await db.select()
      .from(generusTable)
      .where(
        sql`${generusTable.full_name} = ${input.full_name} AND ${generusTable.sambung_group} = ${input.sambung_group}`
      )
      .execute();

    if (existingGenerus.length > 0) {
      // Update existing generus
      const generusId = existingGenerus[0].id;
      const result = await db.update(generusTable)
        .set({
          place_of_birth: input.place_of_birth || null,
          date_of_birth: input.date_of_birth || null,
          gender: input.gender || null,
          level: input.level,
          status: input.status || null,
          profession: input.profession || null,
          skill: input.skill || null,
          notes: input.notes || null,
          photo_url: input.photo_url || null,
          updated_at: new Date()
        })
        .where(eq(generusTable.id, generusId))
        .returning()
        .execute();

      return result[0];
    } else {
      // Create new generus with generated barcode
      const barcode = `GEN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const result = await db.insert(generusTable)
        .values({
          full_name: input.full_name,
          place_of_birth: input.place_of_birth || null,
          date_of_birth: input.date_of_birth || null,
          sambung_group: input.sambung_group,
          gender: input.gender || null,
          level: input.level,
          status: input.status || null,
          profession: input.profession || null,
          skill: input.skill || null,
          notes: input.notes || null,
          photo_url: input.photo_url || null,
          barcode: barcode
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Failed to create or update generus data:', error);
    throw error;
  }
}

// Update generus data (for coordinator with edit capabilities)
export async function updateGenerus(input: UpdateGenerus): Promise<Generus | null> {
  try {
    const updateData: any = {
      updated_at: new Date()
    };

    // Only add fields that are defined in input
    if (input.full_name !== undefined) updateData.full_name = input.full_name;
    if (input.place_of_birth !== undefined) updateData.place_of_birth = input.place_of_birth;
    if (input.date_of_birth !== undefined) updateData.date_of_birth = input.date_of_birth;
    if (input.sambung_group !== undefined) updateData.sambung_group = input.sambung_group;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.profession !== undefined) updateData.profession = input.profession;
    if (input.skill !== undefined) updateData.skill = input.skill;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.photo_url !== undefined) updateData.photo_url = input.photo_url;

    const result = await db.update(generusTable)
      .set(updateData)
      .where(eq(generusTable.id, input.id))
      .returning()
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to update generus:', error);
    throw error;
  }
}

// Delete generus (coordinator only)
export async function deleteGenerus(generusId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Soft delete by setting is_active to false
    const result = await db.update(generusTable)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(generusTable.id, generusId))
      .returning()
      .execute();

    if (result.length > 0) {
      return {
        success: true,
        message: 'Generus deleted successfully'
      };
    } else {
      return {
        success: false,
        message: 'Generus not found'
      };
    }
  } catch (error) {
    console.error('Failed to delete generus:', error);
    throw error;
  }
}

// Get generus by sambung group
export async function getGenerusBySambungGroup(sambungGroup: string): Promise<Generus[]> {
  try {
    const results = await db.select()
      .from(generusTable)
      .where(
        sql`${generusTable.sambung_group} = ${sambungGroup} AND ${generusTable.is_active} = true`
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch generus by sambung group:', error);
    throw error;
  }
}

// Generate barcode for generus
export async function generateGenerusBarcode(generusId: number): Promise<{ barcode: string }> {
  try {
    const barcode = `GEN${generusId}${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Update the generus record with the new barcode
    await db.update(generusTable)
      .set({
        barcode: barcode,
        updated_at: new Date()
      })
      .where(eq(generusTable.id, generusId))
      .execute();

    return { barcode };
  } catch (error) {
    console.error('Failed to generate barcode for generus:', error);
    throw error;
  }
}

// Bulk import generus data (from file upload)
export async function bulkImportGenerus(fileData: any[]): Promise<{ success: boolean; imported: number; errors: string[] }> {
  try {
    const imported: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileData.length; i++) {
      const row = fileData[i];
      try {
        // Validate required fields
        if (!row.full_name || !row.sambung_group || !row.level) {
          errors.push(`Row ${i + 1}: Missing required fields (full_name, sambung_group, level)`);
          continue;
        }

        // Check if generus already exists
        const existingGenerus = await db.select()
          .from(generusTable)
          .where(
            sql`${generusTable.full_name} = ${row.full_name} AND ${generusTable.sambung_group} = ${row.sambung_group}`
          )
          .execute();

        if (existingGenerus.length > 0) {
          errors.push(`Row ${i + 1}: Generus already exists with name "${row.full_name}" in group "${row.sambung_group}"`);
          continue;
        }

        // Generate barcode
        const barcode = `GEN${Date.now()}${i}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Insert new generus
        await db.insert(generusTable)
          .values({
            full_name: row.full_name,
            place_of_birth: row.place_of_birth || null,
            date_of_birth: row.date_of_birth ? new Date(row.date_of_birth) : null,
            sambung_group: row.sambung_group,
            gender: row.gender || null,
            level: row.level,
            status: row.status || null,
            profession: row.profession || null,
            skill: row.skill || null,
            notes: row.notes || null,
            photo_url: row.photo_url || null,
            barcode: barcode
          })
          .execute();

        imported.push(i);
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errors.push(`Row ${i + 1}: Processing error - ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0 || imported.length > 0,
      imported: imported.length,
      errors
    };
  } catch (error) {
    console.error('Bulk import failed:', error);
    throw error;
  }
}