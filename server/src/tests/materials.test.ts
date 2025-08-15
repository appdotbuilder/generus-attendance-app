import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { materialInfoTable, coordinatorsTable } from '../db/schema';
import { type CreateMaterialInfo } from '../schema';
import { 
  createMaterialInfo,
  getAllMaterials,
  getMaterialById,
  updateMaterialInfo,
  deleteMaterialInfo,
  uploadMaterialFile,
  getMaterialsByCoordinator,
  downloadMaterial
} from '../handlers/materials';
import { eq } from 'drizzle-orm';

// Test coordinator data
const testCoordinator = {
  name: 'Test Coordinator',
  access_code: 'TEST123',
  is_active: true
};

// Test material input
const testMaterialInput: CreateMaterialInfo = {
  title: 'Test Material',
  description: 'A material for testing purposes',
  content: 'This is test content for the material',
  link_url: 'https://example.com/material',
  file_url: '/uploads/test-material.pdf',
  coordinator_id: 1 // Will be set after coordinator creation
};

describe('Materials Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let coordinatorId: number;

  beforeEach(async () => {
    // Create test coordinator
    const result = await db.insert(coordinatorsTable)
      .values(testCoordinator)
      .returning()
      .execute();
    
    coordinatorId = result[0].id;
    testMaterialInput.coordinator_id = coordinatorId;
  });

  describe('createMaterialInfo', () => {
    it('should create a material successfully', async () => {
      const result = await createMaterialInfo(testMaterialInput);

      expect(result.id).toBeDefined();
      expect(result.title).toEqual('Test Material');
      expect(result.description).toEqual('A material for testing purposes');
      expect(result.content).toEqual('This is test content for the material');
      expect(result.link_url).toEqual('https://example.com/material');
      expect(result.file_url).toEqual('/uploads/test-material.pdf');
      expect(result.coordinator_id).toEqual(coordinatorId);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create material with minimal data', async () => {
      const minimalInput: CreateMaterialInfo = {
        title: 'Minimal Material',
        coordinator_id: coordinatorId
      };

      const result = await createMaterialInfo(minimalInput);

      expect(result.title).toEqual('Minimal Material');
      expect(result.description).toBeNull();
      expect(result.content).toBeNull();
      expect(result.link_url).toBeNull();
      expect(result.file_url).toBeNull();
      expect(result.coordinator_id).toEqual(coordinatorId);
    });

    it('should save material to database', async () => {
      const result = await createMaterialInfo(testMaterialInput);

      const materials = await db.select()
        .from(materialInfoTable)
        .where(eq(materialInfoTable.id, result.id))
        .execute();

      expect(materials).toHaveLength(1);
      expect(materials[0].title).toEqual('Test Material');
      expect(materials[0].coordinator_id).toEqual(coordinatorId);
    });

    it('should throw error for non-existent coordinator', async () => {
      const invalidInput = {
        title: 'Test Material',
        description: 'A material for testing purposes',
        content: 'This is test content for the material',
        link_url: 'https://example.com/material',
        file_url: '/uploads/test-material.pdf',
        coordinator_id: 999
      };

      await expect(createMaterialInfo(invalidInput)).rejects.toThrow(/coordinator not found/i);
    });
  });

  describe('getAllMaterials', () => {
    it('should return empty array when no materials exist', async () => {
      const result = await getAllMaterials();
      expect(result).toHaveLength(0);
    });

    it('should return all materials', async () => {
      // Create multiple materials
      await createMaterialInfo(testMaterialInput);
      await createMaterialInfo({
        title: 'Second Material',
        description: 'A material for testing purposes',
        content: 'This is test content for the material',
        link_url: 'https://example.com/material',
        file_url: '/uploads/test-material.pdf',
        coordinator_id: coordinatorId
      });

      const result = await getAllMaterials();

      expect(result).toHaveLength(2);
      expect(result[0].title).toEqual('Test Material');
      expect(result[1].title).toEqual('Second Material');
    });
  });

  describe('getMaterialById', () => {
    it('should return material when found', async () => {
      const created = await createMaterialInfo(testMaterialInput);
      const result = await getMaterialById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(created.id);
      expect(result?.title).toEqual('Test Material');
    });

    it('should return null when material not found', async () => {
      const result = await getMaterialById(999);
      expect(result).toBeNull();
    });
  });

  describe('updateMaterialInfo', () => {
    it('should update material successfully', async () => {
      const created = await createMaterialInfo(testMaterialInput);

      const updates = {
        title: 'Updated Material',
        description: 'Updated description'
      };

      const result = await updateMaterialInfo(created.id, updates);

      expect(result).not.toBeNull();
      expect(result?.title).toEqual('Updated Material');
      expect(result?.description).toEqual('Updated description');
      expect(result?.content).toEqual('This is test content for the material'); // Unchanged
      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    it('should update only provided fields', async () => {
      const created = await createMaterialInfo(testMaterialInput);

      const updates = {
        title: 'New Title Only'
      };

      const result = await updateMaterialInfo(created.id, updates);

      expect(result?.title).toEqual('New Title Only');
      expect(result?.description).toEqual('A material for testing purposes'); // Unchanged
      expect(result?.content).toEqual('This is test content for the material'); // Unchanged
    });

    it('should handle null values correctly', async () => {
      const created = await createMaterialInfo(testMaterialInput);

      const updates = {
        description: null, // Should set to null
        content: null      // Should set to null
      };

      const result = await updateMaterialInfo(created.id, updates);

      expect(result?.description).toBeNull();
      expect(result?.content).toBeNull();
      expect(result?.title).toEqual('Test Material'); // Unchanged
    });

    it('should return null for non-existent material', async () => {
      const result = await updateMaterialInfo(999, { title: 'Updated' });
      expect(result).toBeNull();
    });

    it('should throw error when updating with non-existent coordinator', async () => {
      const created = await createMaterialInfo(testMaterialInput);

      await expect(updateMaterialInfo(created.id, { coordinator_id: 999 }))
        .rejects.toThrow(/coordinator not found/i);
    });
  });

  describe('deleteMaterialInfo', () => {
    it('should delete material successfully', async () => {
      const created = await createMaterialInfo(testMaterialInput);

      const result = await deleteMaterialInfo(created.id);

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Material deleted successfully');

      // Verify material is deleted
      const deleted = await getMaterialById(created.id);
      expect(deleted).toBeNull();
    });

    it('should return failure for non-existent material', async () => {
      const result = await deleteMaterialInfo(999);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Material not found');
    });
  });

  describe('uploadMaterialFile', () => {
    it('should handle file upload and create material', async () => {
      const mockFile = {
        name: 'test-document.pdf'
      };

      const result = await uploadMaterialFile(coordinatorId, mockFile);

      expect(result.success).toBe(true);
      expect(result.fileUrl).toEqual('/uploads/materials/test-document.pdf');
      expect(result.materialId).toBeDefined();

      // Verify material was created
      const material = await getMaterialById(result.materialId!);
      expect(material).not.toBeNull();
      expect(material?.title).toEqual('test-document.pdf');
      expect(material?.file_url).toEqual('/uploads/materials/test-document.pdf');
    });

    it('should throw error for non-existent coordinator', async () => {
      const mockFile = {
        name: 'test.pdf'
      };

      await expect(uploadMaterialFile(999, mockFile))
        .rejects.toThrow(/coordinator not found/i);
    });
  });

  describe('getMaterialsByCoordinator', () => {
    it('should return materials for specific coordinator', async () => {
      // Create second coordinator
      const secondCoordinator = await db.insert(coordinatorsTable)
        .values({
          name: 'Second Coordinator',
          access_code: 'COORD2',
          is_active: true
        })
        .returning()
        .execute();

      // Create materials for different coordinators
      await createMaterialInfo(testMaterialInput);
      await createMaterialInfo({
        title: 'Second Material',
        description: 'A material for testing purposes',
        content: 'This is test content for the material',
        link_url: 'https://example.com/material',
        file_url: '/uploads/test-material.pdf',
        coordinator_id: secondCoordinator[0].id
      });

      const result = await getMaterialsByCoordinator(coordinatorId);

      expect(result).toHaveLength(1);
      expect(result[0].title).toEqual('Test Material');
      expect(result[0].coordinator_id).toEqual(coordinatorId);
    });

    it('should return empty array when coordinator has no materials', async () => {
      const result = await getMaterialsByCoordinator(coordinatorId);
      expect(result).toHaveLength(0);
    });

    it('should throw error for non-existent coordinator', async () => {
      await expect(getMaterialsByCoordinator(999))
        .rejects.toThrow(/coordinator not found/i);
    });
  });

  describe('downloadMaterial', () => {
    it('should return download info for material with file', async () => {
      const created = await createMaterialInfo(testMaterialInput);

      const result = await downloadMaterial(created.id);

      expect(result.fileUrl).toEqual('/uploads/test-material.pdf');
      expect(result.fileName).toEqual('test-material.pdf');
    });

    it('should use title as filename when URL parsing fails', async () => {
      const materialWithoutExtension = await createMaterialInfo({
        title: 'Document Title',
        description: 'Test description',
        content: 'Test content',
        link_url: 'https://example.com/link',
        file_url: '/uploads/complex/path/',
        coordinator_id: coordinatorId
      });

      const result = await downloadMaterial(materialWithoutExtension.id);

      expect(result.fileName).toEqual('Document Title');
    });

    it('should throw error for non-existent material', async () => {
      await expect(downloadMaterial(999))
        .rejects.toThrow(/material not found/i);
    });

    it('should throw error for material without file', async () => {
      const materialWithoutFile = await createMaterialInfo({
        title: 'Test Material',
        description: 'Test description',
        content: 'Test content', 
        link_url: 'https://example.com/link',
        coordinator_id: coordinatorId
        // file_url is omitted, so it will be undefined in CreateMaterialInfo
      });

      await expect(downloadMaterial(materialWithoutFile.id))
        .rejects.toThrow(/no file associated/i);
    });
  });
});