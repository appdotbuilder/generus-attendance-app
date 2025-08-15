import { db } from '../db';
import { materialInfoTable, coordinatorsTable } from '../db/schema';
import { type MaterialInfo, type CreateMaterialInfo } from '../schema';
import { eq } from 'drizzle-orm';

// Create material info (coordinator only)
export async function createMaterialInfo(input: CreateMaterialInfo): Promise<MaterialInfo> {
  try {
    // Verify coordinator exists
    const coordinator = await db.select()
      .from(coordinatorsTable)
      .where(eq(coordinatorsTable.id, input.coordinator_id))
      .execute();

    if (!coordinator.length) {
      throw new Error('Coordinator not found');
    }

    // Insert material record
    const result = await db.insert(materialInfoTable)
      .values({
        title: input.title,
        description: input.description || null,
        content: input.content || null,
        link_url: input.link_url || null,
        file_url: input.file_url || null,
        coordinator_id: input.coordinator_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Material creation failed:', error);
    throw error;
  }
}

// Get all materials
export async function getAllMaterials(): Promise<MaterialInfo[]> {
  try {
    const result = await db.select()
      .from(materialInfoTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch all materials:', error);
    throw error;
  }
}

// Get material by ID
export async function getMaterialById(materialId: number): Promise<MaterialInfo | null> {
  try {
    const result = await db.select()
      .from(materialInfoTable)
      .where(eq(materialInfoTable.id, materialId))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to fetch material by ID:', error);
    throw error;
  }
}

// Define update type that allows explicit null values
type UpdateMaterialInfo = {
  title?: string;
  description?: string | null;
  content?: string | null;
  link_url?: string | null;
  file_url?: string | null;
  coordinator_id?: number;
};

// Update material info (coordinator only)
export async function updateMaterialInfo(materialId: number, updates: UpdateMaterialInfo): Promise<MaterialInfo | null> {
  try {
    // Check if material exists
    const existing = await getMaterialById(materialId);
    if (!existing) {
      return null;
    }

    // If coordinator_id is being updated, verify new coordinator exists
    if (updates.coordinator_id) {
      const coordinator = await db.select()
        .from(coordinatorsTable)
        .where(eq(coordinatorsTable.id, updates.coordinator_id))
        .execute();

      if (!coordinator.length) {
        throw new Error('Coordinator not found');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description === null ? null : (updates.description || null);
    if (updates.content !== undefined) updateData.content = updates.content === null ? null : (updates.content || null);
    if (updates.link_url !== undefined) updateData.link_url = updates.link_url === null ? null : (updates.link_url || null);
    if (updates.file_url !== undefined) updateData.file_url = updates.file_url === null ? null : (updates.file_url || null);
    if (updates.coordinator_id !== undefined) updateData.coordinator_id = updates.coordinator_id;

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db.update(materialInfoTable)
      .set(updateData)
      .where(eq(materialInfoTable.id, materialId))
      .returning()
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Material update failed:', error);
    throw error;
  }
}

// Delete material info (coordinator only)
export async function deleteMaterialInfo(materialId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Check if material exists
    const existing = await getMaterialById(materialId);
    if (!existing) {
      return {
        success: false,
        message: 'Material not found'
      };
    }

    await db.delete(materialInfoTable)
      .where(eq(materialInfoTable.id, materialId))
      .execute();

    return {
      success: true,
      message: 'Material deleted successfully'
    };
  } catch (error) {
    console.error('Material deletion failed:', error);
    throw error;
  }
}

// Upload material file (PDF/DOC/XLSX)
export async function uploadMaterialFile(coordinatorId: number, file: any): Promise<{ success: boolean; fileUrl: string; materialId?: number }> {
  try {
    // Verify coordinator exists
    const coordinator = await db.select()
      .from(coordinatorsTable)
      .where(eq(coordinatorsTable.id, coordinatorId))
      .execute();

    if (!coordinator.length) {
      throw new Error('Coordinator not found');
    }

    // In a real implementation, this would handle actual file upload
    // For now, we'll simulate the file upload process
    const fileUrl = `/uploads/materials/${file.name}`;
    
    // Create material record for the uploaded file
    const materialInput: CreateMaterialInfo = {
      title: file.name || 'Uploaded Material',
      description: `Material uploaded by ${coordinator[0].name}`,
      file_url: fileUrl,
      coordinator_id: coordinatorId
    };

    const material = await createMaterialInfo(materialInput);

    return {
      success: true,
      fileUrl: fileUrl,
      materialId: material.id
    };
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}

// Get materials by coordinator
export async function getMaterialsByCoordinator(coordinatorId: number): Promise<MaterialInfo[]> {
  try {
    // Verify coordinator exists
    const coordinator = await db.select()
      .from(coordinatorsTable)
      .where(eq(coordinatorsTable.id, coordinatorId))
      .execute();

    if (!coordinator.length) {
      throw new Error('Coordinator not found');
    }

    const result = await db.select()
      .from(materialInfoTable)
      .where(eq(materialInfoTable.coordinator_id, coordinatorId))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch materials by coordinator:', error);
    throw error;
  }
}

// Download material file
export async function downloadMaterial(materialId: number): Promise<{ fileUrl: string; fileName: string }> {
  try {
    const material = await getMaterialById(materialId);
    
    if (!material) {
      throw new Error('Material not found');
    }

    if (!material.file_url) {
      throw new Error('No file associated with this material');
    }

    // Extract filename from URL or use title as fallback
    const urlParts = material.file_url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const fileName = lastPart && lastPart.trim() !== '' ? lastPart : material.title;

    return {
      fileUrl: material.file_url,
      fileName: fileName
    };
  } catch (error) {
    console.error('Material download failed:', error);
    throw error;
  }
}