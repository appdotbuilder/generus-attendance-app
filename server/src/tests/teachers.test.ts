import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { getActiveTeachers } from '../handlers/teachers';

// Test data for teachers
const activeTeacher1 = {
  name: 'Ahmad Rahman',
  email: 'ahmad.rahman@example.com',
  username: 'ahmad_rahman',
  password_hash: 'hashed_password_123',
  is_active: true
};

const activeTeacher2 = {
  name: 'Fatima Sari',
  email: 'fatima.sari@example.com', 
  username: 'fatima_sari',
  password_hash: 'hashed_password_456',
  is_active: true
};

const inactiveTeacher = {
  name: 'Budi Santoso',
  email: 'budi.santoso@example.com',
  username: 'budi_santoso',
  password_hash: 'hashed_password_789',
  is_active: false
};

describe('getActiveTeachers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active teachers', async () => {
    // Create test teachers
    await db.insert(teachersTable)
      .values([activeTeacher1, activeTeacher2, inactiveTeacher])
      .execute();

    const result = await getActiveTeachers();

    // Should return only active teachers
    expect(result).toHaveLength(2);
    
    // Verify the returned teachers are active
    result.forEach(teacher => {
      expect(teacher.is_active).toBe(true);
    });

    // Verify specific teacher data
    const teacherNames = result.map(t => t.name).sort();
    expect(teacherNames).toEqual(['Ahmad Rahman', 'Fatima Sari']);

    // Verify all required fields are present
    result.forEach(teacher => {
      expect(teacher.id).toBeDefined();
      expect(teacher.name).toBeDefined();
      expect(teacher.email).toBeDefined();
      expect(teacher.username).toBeDefined();
      expect(teacher.password_hash).toBeDefined();
      expect(teacher.is_active).toBe(true);
      expect(teacher.created_at).toBeInstanceOf(Date);
      expect(teacher.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no active teachers exist', async () => {
    // Create only inactive teacher
    await db.insert(teachersTable)
      .values(inactiveTeacher)
      .execute();

    const result = await getActiveTeachers();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when no teachers exist at all', async () => {
    const result = await getActiveTeachers();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle multiple active teachers correctly', async () => {
    // Create multiple active teachers
    const manyActiveTeachers = Array.from({ length: 5 }, (_, i) => ({
      name: `Teacher ${i + 1}`,
      email: `teacher${i + 1}@example.com`,
      username: `teacher_${i + 1}`,
      password_hash: `hashed_password_${i + 1}`,
      is_active: true
    }));

    await db.insert(teachersTable)
      .values(manyActiveTeachers)
      .execute();

    const result = await getActiveTeachers();

    expect(result).toHaveLength(5);
    result.forEach((teacher, index) => {
      expect(teacher.name).toBe(`Teacher ${index + 1}`);
      expect(teacher.is_active).toBe(true);
    });
  });

  it('should only return teachers with is_active = true', async () => {
    // Create mix of active and inactive teachers
    const mixedTeachers = [
      { ...activeTeacher1, is_active: true },
      { ...activeTeacher2, is_active: false },
      { ...inactiveTeacher, is_active: true, email: 'different@example.com', username: 'different_user' },
    ];

    await db.insert(teachersTable)
      .values(mixedTeachers)
      .execute();

    const result = await getActiveTeachers();

    expect(result).toHaveLength(2);
    result.forEach(teacher => {
      expect(teacher.is_active).toBe(true);
    });

    const activeNames = result.map(t => t.name).sort();
    expect(activeNames).toEqual(['Ahmad Rahman', 'Budi Santoso']);
  });
});