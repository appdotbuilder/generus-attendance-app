import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { criticismSuggestionsTable, teachersTable, coordinatorsTable, generusTable } from '../db/schema';
import { type CreateCriticismSuggestion } from '../schema';
import {
  createCriticismSuggestion,
  getAllCriticismSuggestions,
  getCriticismSuggestionsByUserType,
  getCriticismSuggestionsByUser,
  getCriticismSuggestionsByDateRange,
  deleteCriticismSuggestion,
  markCriticismSuggestionAsRead,
  getUnreadCriticismSuggestionsCount
} from '../handlers/criticism_suggestions';
import { eq, and, gte, lte } from 'drizzle-orm';

// Test inputs for different user types
const teacherInput: CreateCriticismSuggestion = {
  user_type: 'teacher',
  user_id: 1,
  user_name: 'Test Teacher',
  message: 'This is a test criticism from a teacher'
};

const generusInput: CreateCriticismSuggestion = {
  user_type: 'generus',
  user_id: 2,
  user_name: 'Test Generus',
  message: 'This is a test suggestion from a generus'
};

const coordinatorInput: CreateCriticismSuggestion = {
  user_type: 'coordinator',
  user_id: 3,
  user_name: 'Test Coordinator',
  message: 'This is a test feedback from a coordinator'
};

describe('createCriticismSuggestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a criticism/suggestion from teacher', async () => {
    const result = await createCriticismSuggestion(teacherInput);

    expect(result.user_type).toEqual('teacher');
    expect(result.user_id).toEqual(1);
    expect(result.user_name).toEqual('Test Teacher');
    expect(result.message).toEqual('This is a test criticism from a teacher');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a criticism/suggestion from generus', async () => {
    const result = await createCriticismSuggestion(generusInput);

    expect(result.user_type).toEqual('generus');
    expect(result.user_id).toEqual(2);
    expect(result.user_name).toEqual('Test Generus');
    expect(result.message).toEqual('This is a test suggestion from a generus');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a criticism/suggestion from coordinator', async () => {
    const result = await createCriticismSuggestion(coordinatorInput);

    expect(result.user_type).toEqual('coordinator');
    expect(result.user_id).toEqual(3);
    expect(result.user_name).toEqual('Test Coordinator');
    expect(result.message).toEqual('This is a test feedback from a coordinator');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save criticism/suggestion to database', async () => {
    const result = await createCriticismSuggestion(teacherInput);

    const records = await db.select()
      .from(criticismSuggestionsTable)
      .where(eq(criticismSuggestionsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].user_type).toEqual('teacher');
    expect(records[0].user_id).toEqual(1);
    expect(records[0].user_name).toEqual('Test Teacher');
    expect(records[0].message).toEqual('This is a test criticism from a teacher');
    expect(records[0].created_at).toBeInstanceOf(Date);
  });
});

describe('getAllCriticismSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no records exist', async () => {
    const result = await getAllCriticismSuggestions();
    expect(result).toEqual([]);
  });

  it('should return all criticism/suggestions', async () => {
    // Create multiple records
    await createCriticismSuggestion(teacherInput);
    await createCriticismSuggestion(generusInput);
    await createCriticismSuggestion(coordinatorInput);

    const results = await getAllCriticismSuggestions();

    expect(results).toHaveLength(3);
    expect(results.map(r => r.user_type)).toContain('teacher');
    expect(results.map(r => r.user_type)).toContain('generus');
    expect(results.map(r => r.user_type)).toContain('coordinator');
  });

  it('should return records with all required fields', async () => {
    await createCriticismSuggestion(teacherInput);

    const results = await getAllCriticismSuggestions();

    expect(results).toHaveLength(1);
    const record = results[0];
    expect(record.id).toBeDefined();
    expect(record.user_type).toBeDefined();
    expect(record.user_id).toBeDefined();
    expect(record.user_name).toBeDefined();
    expect(record.message).toBeDefined();
    expect(record.created_at).toBeInstanceOf(Date);
  });
});

describe('getCriticismSuggestionsByUserType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no records for user type exist', async () => {
    const result = await getCriticismSuggestionsByUserType('teacher');
    expect(result).toEqual([]);
  });

  it('should return only teacher records', async () => {
    // Create records for different user types
    await createCriticismSuggestion(teacherInput);
    await createCriticismSuggestion(generusInput);
    await createCriticismSuggestion(coordinatorInput);

    const results = await getCriticismSuggestionsByUserType('teacher');

    expect(results).toHaveLength(1);
    expect(results[0].user_type).toEqual('teacher');
    expect(results[0].user_name).toEqual('Test Teacher');
  });

  it('should return only generus records', async () => {
    // Create multiple generus records and one teacher record
    await createCriticismSuggestion(generusInput);
    await createCriticismSuggestion({ ...generusInput, user_id: 4, user_name: 'Another Generus' });
    await createCriticismSuggestion(teacherInput);

    const results = await getCriticismSuggestionsByUserType('generus');

    expect(results).toHaveLength(2);
    results.forEach(record => {
      expect(record.user_type).toEqual('generus');
    });
  });

  it('should return only coordinator records', async () => {
    await createCriticismSuggestion(teacherInput);
    await createCriticismSuggestion(coordinatorInput);

    const results = await getCriticismSuggestionsByUserType('coordinator');

    expect(results).toHaveLength(1);
    expect(results[0].user_type).toEqual('coordinator');
    expect(results[0].user_name).toEqual('Test Coordinator');
  });
});

describe('getCriticismSuggestionsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no records for specific user exist', async () => {
    const result = await getCriticismSuggestionsByUser(999, 'teacher');
    expect(result).toEqual([]);
  });

  it('should return records for specific teacher user', async () => {
    // Create records for different users
    await createCriticismSuggestion(teacherInput);
    await createCriticismSuggestion({ ...teacherInput, user_id: 5, user_name: 'Another Teacher' });
    await createCriticismSuggestion(generusInput);

    const results = await getCriticismSuggestionsByUser(1, 'teacher');

    expect(results).toHaveLength(1);
    expect(results[0].user_type).toEqual('teacher');
    expect(results[0].user_id).toEqual(1);
    expect(results[0].user_name).toEqual('Test Teacher');
  });

  it('should return multiple records for same user', async () => {
    // Create multiple records for same user
    await createCriticismSuggestion(generusInput);
    await createCriticismSuggestion({ ...generusInput, message: 'Another message from same user' });

    const results = await getCriticismSuggestionsByUser(2, 'generus');

    expect(results).toHaveLength(2);
    results.forEach(record => {
      expect(record.user_type).toEqual('generus');
      expect(record.user_id).toEqual(2);
      expect(record.user_name).toEqual('Test Generus');
    });
  });

  it('should not return records with same user_id but different user_type', async () => {
    // Create records with same ID but different types (edge case)
    await createCriticismSuggestion({ ...teacherInput, user_id: 10 });
    await createCriticismSuggestion({ ...generusInput, user_id: 10 });

    const teacherResults = await getCriticismSuggestionsByUser(10, 'teacher');
    const generusResults = await getCriticismSuggestionsByUser(10, 'generus');

    expect(teacherResults).toHaveLength(1);
    expect(teacherResults[0].user_type).toEqual('teacher');

    expect(generusResults).toHaveLength(1);
    expect(generusResults[0].user_type).toEqual('generus');
  });
});

describe('getCriticismSuggestionsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no records in date range exist', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const result = await getCriticismSuggestionsByDateRange(startDate, endDate);
    expect(result).toEqual([]);
  });

  it('should return records within date range', async () => {
    // Create date range first to ensure records fall within it
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Create test records
    await createCriticismSuggestion(teacherInput);
    await createCriticismSuggestion(generusInput);

    const results = await getCriticismSuggestionsByDateRange(startOfDay, endOfDay);

    expect(results.length).toBeGreaterThan(0);
    results.forEach(record => {
      expect(record.created_at).toBeInstanceOf(Date);
      expect(record.created_at >= startOfDay).toBe(true);
      expect(record.created_at <= endOfDay).toBe(true);
    });
  });

  it('should not return records outside date range', async () => {
    await createCriticismSuggestion(teacherInput);

    // Set date range to tomorrow and day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const results = await getCriticismSuggestionsByDateRange(tomorrow, dayAfter);

    expect(results).toHaveLength(0);
  });

  it('should handle date range queries correctly', async () => {
    // Create multiple records
    await createCriticismSuggestion(teacherInput);
    await createCriticismSuggestion(generusInput);
    await createCriticismSuggestion(coordinatorInput);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query from yesterday to tomorrow (should include all today's records)
    const results = await getCriticismSuggestionsByDateRange(yesterday, tomorrow);

    expect(results).toHaveLength(3);
  });
});

describe('deleteCriticismSuggestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing criticism/suggestion', async () => {
    const created = await createCriticismSuggestion(teacherInput);

    const result = await deleteCriticismSuggestion(created.id);

    expect(result.success).toBe(true);
    expect(result.message).toEqual('Criticism/suggestion deleted successfully');

    // Verify it's deleted from database
    const records = await db.select()
      .from(criticismSuggestionsTable)
      .where(eq(criticismSuggestionsTable.id, created.id))
      .execute();

    expect(records).toHaveLength(0);
  });

  it('should return failure when criticism/suggestion does not exist', async () => {
    const result = await deleteCriticismSuggestion(999);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Criticism/suggestion not found');
  });

  it('should only delete specific record', async () => {
    const created1 = await createCriticismSuggestion(teacherInput);
    const created2 = await createCriticismSuggestion(generusInput);

    await deleteCriticismSuggestion(created1.id);

    // Verify only one record is deleted
    const allRecords = await getAllCriticismSuggestions();
    expect(allRecords).toHaveLength(1);
    expect(allRecords[0].id).toEqual(created2.id);
  });
});

describe('markCriticismSuggestionAsRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark existing criticism/suggestion as read', async () => {
    const created = await createCriticismSuggestion(teacherInput);

    const result = await markCriticismSuggestionAsRead(created.id);

    expect(result.success).toBe(true);
    expect(result.message).toEqual('Marked as read successfully');
  });

  it('should return failure when criticism/suggestion does not exist', async () => {
    const result = await markCriticismSuggestionAsRead(999);

    expect(result.success).toBe(false);
    expect(result.message).toEqual('Criticism/suggestion not found');
  });

  it('should handle valid record correctly', async () => {
    const created = await createCriticismSuggestion(generusInput);

    const result = await markCriticismSuggestionAsRead(created.id);

    expect(result.success).toBe(true);

    // Verify record still exists (since we don't have actual read status field)
    const records = await db.select()
      .from(criticismSuggestionsTable)
      .where(eq(criticismSuggestionsTable.id, created.id))
      .execute();

    expect(records).toHaveLength(1);
  });
});

describe('getUnreadCriticismSuggestionsCount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero count when no records exist', async () => {
    const result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(0);
  });

  it('should return correct count of records', async () => {
    // Create multiple records
    await createCriticismSuggestion(teacherInput);
    await createCriticismSuggestion(generusInput);
    await createCriticismSuggestion(coordinatorInput);

    const result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(3);
  });

  it('should update count after creating new records', async () => {
    // Initially zero
    let result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(0);

    // Add one record
    await createCriticismSuggestion(teacherInput);
    result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(1);

    // Add another record
    await createCriticismSuggestion(generusInput);
    result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(2);
  });

  it('should update count after deleting records', async () => {
    // Create records
    const created1 = await createCriticismSuggestion(teacherInput);
    const created2 = await createCriticismSuggestion(generusInput);

    let result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(2);

    // Delete one record
    await deleteCriticismSuggestion(created1.id);
    result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(1);

    // Delete remaining record
    await deleteCriticismSuggestion(created2.id);
    result = await getUnreadCriticismSuggestionsCount();
    expect(result.count).toEqual(0);
  });
});