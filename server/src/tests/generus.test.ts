import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { generusTable } from '../db/schema';
import { type GenerusDataInput, type UpdateGenerus } from '../schema';
import {
  getAllGenerus,
  getGenerusById,
  getGenerusByBarcode,
  createOrUpdateGenerusData,
  updateGenerus,
  deleteGenerus,
  getGenerusBySambungGroup,
  generateGenerusBarcode,
  bulkImportGenerus
} from '../handlers/generus';
import { eq } from 'drizzle-orm';

// Test data
const testGenerusInput: GenerusDataInput = {
  full_name: 'Ahmad Rizki',
  place_of_birth: 'Jakarta',
  date_of_birth: new Date('1995-05-15'),
  sambung_group: 'Kelompok A',
  gender: 'male',
  level: 'remaja',
  status: 'Active',
  profession: 'Student',
  skill: 'Programming',
  notes: 'Test notes',
  photo_url: 'https://example.com/photo.jpg'
};

const testGenerusInput2: GenerusDataInput = {
  full_name: 'Siti Aminah',
  sambung_group: 'Kelompok B',
  level: 'pra-remaja',
  gender: 'female'
};

describe('generus handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getAllGenerus', () => {
    it('should return all active generus', async () => {
      // Create test generus
      await createOrUpdateGenerusData(testGenerusInput);
      await createOrUpdateGenerusData(testGenerusInput2);

      const results = await getAllGenerus();

      expect(results).toHaveLength(2);
      expect(results[0].full_name).toBe('Ahmad Rizki');
      expect(results[1].full_name).toBe('Siti Aminah');
      expect(results[0].is_active).toBe(true);
      expect(results[1].is_active).toBe(true);
    });

    it('should not return inactive generus', async () => {
      // Create and then delete a generus (soft delete)
      const generus = await createOrUpdateGenerusData(testGenerusInput);
      await deleteGenerus(generus.id);

      const results = await getAllGenerus();

      expect(results).toHaveLength(0);
    });

    it('should return empty array when no generus exist', async () => {
      const results = await getAllGenerus();
      expect(results).toHaveLength(0);
    });
  });

  describe('getGenerusById', () => {
    it('should return generus by valid ID', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);

      const result = await getGenerusById(createdGenerus.id);

      expect(result).not.toBeNull();
      expect(result!.full_name).toBe('Ahmad Rizki');
      expect(result!.sambung_group).toBe('Kelompok A');
      expect(result!.level).toBe('remaja');
    });

    it('should return null for non-existent ID', async () => {
      const result = await getGenerusById(999);
      expect(result).toBeNull();
    });

    it('should return inactive generus by ID', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);
      await deleteGenerus(createdGenerus.id);

      const result = await getGenerusById(createdGenerus.id);

      expect(result).not.toBeNull();
      expect(result!.is_active).toBe(false);
    });
  });

  describe('getGenerusByBarcode', () => {
    it('should return generus by valid barcode', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);

      const result = await getGenerusByBarcode(createdGenerus.barcode!);

      expect(result).not.toBeNull();
      expect(result!.full_name).toBe('Ahmad Rizki');
      expect(result!.barcode).toBe(createdGenerus.barcode);
    });

    it('should return null for non-existent barcode', async () => {
      const result = await getGenerusByBarcode('INVALID_BARCODE');
      expect(result).toBeNull();
    });
  });

  describe('createOrUpdateGenerusData', () => {
    it('should create new generus with all fields', async () => {
      const result = await createOrUpdateGenerusData(testGenerusInput);

      expect(result.full_name).toBe('Ahmad Rizki');
      expect(result.place_of_birth).toBe('Jakarta');
      expect(result.date_of_birth).toEqual(new Date('1995-05-15'));
      expect(result.sambung_group).toBe('Kelompok A');
      expect(result.gender).toBe('male');
      expect(result.level).toBe('remaja');
      expect(result.status).toBe('Active');
      expect(result.profession).toBe('Student');
      expect(result.skill).toBe('Programming');
      expect(result.notes).toBe('Test notes');
      expect(result.photo_url).toBe('https://example.com/photo.jpg');
      expect(result.barcode).toMatch(/^GEN\d+[A-Z0-9]+$/);
      expect(result.is_active).toBe(true);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create new generus with minimal required fields', async () => {
      const minimalInput: GenerusDataInput = {
        full_name: 'Test User',
        sambung_group: 'Test Group',
        level: 'remaja'
      };

      const result = await createOrUpdateGenerusData(minimalInput);

      expect(result.full_name).toBe('Test User');
      expect(result.sambung_group).toBe('Test Group');
      expect(result.level).toBe('remaja');
      expect(result.place_of_birth).toBeNull();
      expect(result.date_of_birth).toBeNull();
      expect(result.gender).toBeNull();
      expect(result.barcode).toMatch(/^GEN\d+[A-Z0-9]+$/);
    });

    it('should update existing generus with same name and sambung_group', async () => {
      // Create initial generus
      const initial = await createOrUpdateGenerusData({
        full_name: 'Test User',
        sambung_group: 'Test Group',
        level: 'remaja',
        profession: 'Student'
      });

      // Update with same name and group but different data
      const updated = await createOrUpdateGenerusData({
        full_name: 'Test User',
        sambung_group: 'Test Group',
        level: 'usia-mandiri-kuliah',
        profession: 'Engineer',
        skill: 'Programming'
      });

      expect(updated.id).toBe(initial.id);
      expect(updated.level).toBe('usia-mandiri-kuliah');
      expect(updated.profession).toBe('Engineer');
      expect(updated.skill).toBe('Programming');
      expect(updated.barcode).toBe(initial.barcode);
    });
  });

  describe('updateGenerus', () => {
    it('should update existing generus', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);

      const updateInput: UpdateGenerus = {
        id: createdGenerus.id,
        full_name: 'Ahmad Updated',
        profession: 'Developer',
        level: 'usia-mandiri-kuliah'
      };

      const result = await updateGenerus(updateInput);

      expect(result).not.toBeNull();
      expect(result!.full_name).toBe('Ahmad Updated');
      expect(result!.profession).toBe('Developer');
      expect(result!.level).toBe('usia-mandiri-kuliah');
      expect(result!.sambung_group).toBe('Kelompok A'); // Unchanged
    });

    it('should return null for non-existent generus', async () => {
      const updateInput: UpdateGenerus = {
        id: 999,
        full_name: 'Non Existent'
      };

      const result = await updateGenerus(updateInput);
      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);

      const updateInput: UpdateGenerus = {
        id: createdGenerus.id,
        notes: 'Updated notes only'
      };

      const result = await updateGenerus(updateInput);

      expect(result).not.toBeNull();
      expect(result!.notes).toBe('Updated notes only');
      expect(result!.full_name).toBe('Ahmad Rizki'); // Unchanged
      expect(result!.profession).toBe('Student'); // Unchanged
    });
  });

  describe('deleteGenerus', () => {
    it('should soft delete existing generus', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);

      const result = await deleteGenerus(createdGenerus.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Generus deleted successfully');

      // Verify soft delete
      const deletedGenerus = await getGenerusById(createdGenerus.id);
      expect(deletedGenerus!.is_active).toBe(false);
    });

    it('should return failure for non-existent generus', async () => {
      const result = await deleteGenerus(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Generus not found');
    });
  });

  describe('getGenerusBySambungGroup', () => {
    it('should return all generus in sambung group', async () => {
      // Create multiple generus in same group
      const input1 = { ...testGenerusInput, full_name: 'User 1' };
      const input2 = { ...testGenerusInput, full_name: 'User 2' };

      await createOrUpdateGenerusData(input1);
      await createOrUpdateGenerusData(input2);

      const results = await getGenerusBySambungGroup('Kelompok A');

      expect(results).toHaveLength(2);
      expect(results[0].sambung_group).toBe('Kelompok A');
      expect(results[1].sambung_group).toBe('Kelompok A');
    });

    it('should not return inactive generus', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);
      await deleteGenerus(createdGenerus.id);

      const results = await getGenerusBySambungGroup('Kelompok A');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for non-existent sambung group', async () => {
      const results = await getGenerusBySambungGroup('Non Existent Group');
      expect(results).toHaveLength(0);
    });
  });

  describe('generateGenerusBarcode', () => {
    it('should generate and update barcode for existing generus', async () => {
      const createdGenerus = await createOrUpdateGenerusData(testGenerusInput);
      const originalBarcode = createdGenerus.barcode;

      const result = await generateGenerusBarcode(createdGenerus.id);

      expect(result.barcode).toMatch(/^GEN\d+[A-Z0-9]+$/);
      expect(result.barcode).not.toBe(originalBarcode);

      // Verify database was updated
      const updatedGenerus = await getGenerusById(createdGenerus.id);
      expect(updatedGenerus!.barcode).toBe(result.barcode);
    });
  });

  describe('bulkImportGenerus', () => {
    it('should import valid generus data', async () => {
      const bulkData = [
        {
          full_name: 'Bulk User 1',
          sambung_group: 'Bulk Group A',
          level: 'remaja',
          gender: 'male',
          profession: 'Student'
        },
        {
          full_name: 'Bulk User 2',
          sambung_group: 'Bulk Group B',
          level: 'pra-remaja',
          gender: 'female'
        }
      ];

      const result = await bulkImportGenerus(bulkData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Verify data was imported
      const allGenerus = await getAllGenerus();
      expect(allGenerus).toHaveLength(2);
    });

    it('should handle missing required fields', async () => {
      const bulkData = [
        {
          full_name: 'Valid User',
          sambung_group: 'Valid Group',
          level: 'remaja'
        },
        {
          // Missing required fields
          full_name: '',
          sambung_group: 'Test Group'
        }
      ];

      const result = await bulkImportGenerus(bulkData);

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/Row 2.*Missing required fields/);
    });

    it('should handle duplicate entries', async () => {
      // Create existing generus
      await createOrUpdateGenerusData(testGenerusInput);

      const bulkData = [
        {
          full_name: 'Ahmad Rizki', // Duplicate
          sambung_group: 'Kelompok A',
          level: 'remaja'
        }
      ];

      const result = await bulkImportGenerus(bulkData);

      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/already exists/);
    });

    it('should handle empty bulk data', async () => {
      const result = await bulkImportGenerus([]);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});