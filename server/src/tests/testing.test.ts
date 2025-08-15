import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testingTable, generusTable, teachersTable } from '../db/schema';
import { type CreateTesting, type TestType } from '../schema';
import {
    createTestResult,
    getTestResultsByGenerus,
    getTestResultsByType,
    getTestResultsByTeacher,
    getAllTestResults,
    updateTestResult,
    deleteTestResult,
    getTestStatisticsByGenerus,
    getTestSummary
} from '../handlers/testing';
import { eq } from 'drizzle-orm';

// Test data
const testGenerus = {
    full_name: 'Test Generus',
    sambung_group: 'Test Group',
    level: 'remaja' as const,
    is_active: true
};

const testTeacher = {
    name: 'Test Teacher',
    email: 'teacher@test.com',
    username: 'testteacher',
    password_hash: 'hashedpassword',
    is_active: true
};

const testInput: CreateTesting = {
    generus_id: 1,
    test_type: 'tilawati',
    score: 85.5,
    notes: 'Good performance',
    teacher_id: 1
};

describe('Testing Handlers', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    let generusId: number;
    let teacherId: number;

    beforeEach(async () => {
        // Create prerequisite data
        const generusResult = await db.insert(generusTable)
            .values(testGenerus)
            .returning({ id: generusTable.id })
            .execute();
        generusId = generusResult[0].id;

        const teacherResult = await db.insert(teachersTable)
            .values(testTeacher)
            .returning({ id: teachersTable.id })
            .execute();
        teacherId = teacherResult[0].id;

        // Update test input with actual IDs
        testInput.generus_id = generusId;
        testInput.teacher_id = teacherId;
    });

    describe('createTestResult', () => {
        it('should create a test result', async () => {
            const result = await createTestResult(testInput);

            expect(result.generus_id).toBe(generusId);
            expect(result.test_type).toBe('tilawati');
            expect(result.score).toBe(85.5);
            expect(typeof result.score).toBe('number');
            expect(result.notes).toBe('Good performance');
            expect(result.teacher_id).toBe(teacherId);
            expect(result.id).toBeDefined();
            expect(result.created_at).toBeInstanceOf(Date);
        });

        it('should save test result to database', async () => {
            const result = await createTestResult(testInput);

            const savedTests = await db.select()
                .from(testingTable)
                .where(eq(testingTable.id, result.id))
                .execute();

            expect(savedTests).toHaveLength(1);
            expect(savedTests[0].generus_id).toBe(generusId);
            expect(savedTests[0].test_type).toBe('tilawati');
            expect(parseFloat(savedTests[0].score)).toBe(85.5);
            expect(savedTests[0].notes).toBe('Good performance');
            expect(savedTests[0].teacher_id).toBe(teacherId);
        });

        it('should handle test result without notes', async () => {
            const inputWithoutNotes = {
                ...testInput,
                notes: undefined
            };

            const result = await createTestResult(inputWithoutNotes);

            expect(result.notes).toBe(null);
        });

        it('should throw error for non-existent generus', async () => {
            const invalidInput = {
                ...testInput,
                generus_id: 99999
            };

            await expect(createTestResult(invalidInput)).rejects.toThrow(/generus not found/i);
        });

        it('should throw error for non-existent teacher', async () => {
            const invalidInput = {
                ...testInput,
                teacher_id: 99999
            };

            await expect(createTestResult(invalidInput)).rejects.toThrow(/teacher not found/i);
        });
    });

    describe('getTestResultsByGenerus', () => {
        it('should return test results for specific generus', async () => {
            // Create multiple test results
            await createTestResult(testInput);
            await createTestResult({ ...testInput, test_type: 'alquran', score: 90 });

            // Create another generus and test result for comparison
            const anotherGenerus = await db.insert(generusTable)
                .values({ ...testGenerus, full_name: 'Another Generus' })
                .returning({ id: generusTable.id })
                .execute();

            await createTestResult({
                ...testInput,
                generus_id: anotherGenerus[0].id,
                score: 75
            });

            const results = await getTestResultsByGenerus(generusId);

            expect(results).toHaveLength(2);
            results.forEach(result => {
                expect(result.generus_id).toBe(generusId);
                expect(typeof result.score).toBe('number');
            });

            // Check that results are ordered by created_at desc
            expect(results[0].test_type).toBe('alquran'); // More recent
            expect(results[1].test_type).toBe('tilawati'); // Earlier
        });

        it('should return empty array for generus with no tests', async () => {
            const results = await getTestResultsByGenerus(generusId);
            expect(results).toHaveLength(0);
        });
    });

    describe('getTestResultsByType', () => {
        it('should return test results for specific test type', async () => {
            // Create multiple test results of different types
            await createTestResult(testInput);
            await createTestResult({ ...testInput, test_type: 'alquran', score: 90 });
            await createTestResult({ ...testInput, test_type: 'tilawati', score: 88 });

            const results = await getTestResultsByType('tilawati');

            expect(results).toHaveLength(2);
            results.forEach(result => {
                expect(result.test_type).toBe('tilawati');
                expect(typeof result.score).toBe('number');
            });
        });

        it('should return empty array for test type with no results', async () => {
            const results = await getTestResultsByType('hadits');
            expect(results).toHaveLength(0);
        });
    });

    describe('getTestResultsByTeacher', () => {
        it('should return test results for specific teacher', async () => {
            // Create another teacher
            const anotherTeacher = await db.insert(teachersTable)
                .values({ ...testTeacher, email: 'teacher2@test.com', username: 'teacher2' })
                .returning({ id: teachersTable.id })
                .execute();

            // Create test results for both teachers
            await createTestResult(testInput);
            await createTestResult({ ...testInput, test_type: 'alquran', score: 90 });
            await createTestResult({
                ...testInput,
                teacher_id: anotherTeacher[0].id,
                score: 75
            });

            const results = await getTestResultsByTeacher(teacherId);

            expect(results).toHaveLength(2);
            results.forEach(result => {
                expect(result.teacher_id).toBe(teacherId);
                expect(typeof result.score).toBe('number');
            });
        });

        it('should return empty array for teacher with no tests', async () => {
            const results = await getTestResultsByTeacher(teacherId);
            expect(results).toHaveLength(0);
        });
    });

    describe('getAllTestResults', () => {
        it('should return all test results', async () => {
            // Create multiple test results
            await createTestResult(testInput);
            await createTestResult({ ...testInput, test_type: 'alquran', score: 90 });
            await createTestResult({ ...testInput, test_type: 'hadits', score: 82 });

            const results = await getAllTestResults();

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(typeof result.score).toBe('number');
                expect(result.created_at).toBeInstanceOf(Date);
            });
        });

        it('should return empty array when no test results exist', async () => {
            const results = await getAllTestResults();
            expect(results).toHaveLength(0);
        });
    });

    describe('updateTestResult', () => {
        it('should update test result', async () => {
            const testResult = await createTestResult(testInput);

            const updates = {
                score: 95,
                notes: 'Excellent performance',
                test_type: 'alquran' as TestType
            };

            const updatedResult = await updateTestResult(testResult.id, updates);

            expect(updatedResult).not.toBeNull();
            expect(updatedResult!.score).toBe(95);
            expect(typeof updatedResult!.score).toBe('number');
            expect(updatedResult!.notes).toBe('Excellent performance');
            expect(updatedResult!.test_type).toBe('alquran');
        });

        it('should return null for non-existent test result', async () => {
            const result = await updateTestResult(99999, { score: 95 });
            expect(result).toBeNull();
        });

        it('should throw error when updating with non-existent generus', async () => {
            const testResult = await createTestResult(testInput);

            await expect(updateTestResult(testResult.id, { generus_id: 99999 }))
                .rejects.toThrow(/generus not found/i);
        });

        it('should throw error when updating with non-existent teacher', async () => {
            const testResult = await createTestResult(testInput);

            await expect(updateTestResult(testResult.id, { teacher_id: 99999 }))
                .rejects.toThrow(/teacher not found/i);
        });
    });

    describe('deleteTestResult', () => {
        it('should delete test result', async () => {
            const testResult = await createTestResult(testInput);

            const result = await deleteTestResult(testResult.id);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Test result deleted successfully');

            // Verify it's deleted from database
            const deletedTests = await db.select()
                .from(testingTable)
                .where(eq(testingTable.id, testResult.id))
                .execute();

            expect(deletedTests).toHaveLength(0);
        });

        it('should return failure for non-existent test result', async () => {
            const result = await deleteTestResult(99999);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Test result not found');
        });
    });

    describe('getTestStatisticsByGenerus', () => {
        beforeEach(async () => {
            // Create test results for different test types
            await createTestResult({ ...testInput, test_type: 'tilawati', score: 80 });
            await createTestResult({ ...testInput, test_type: 'tilawati', score: 90 });
            await createTestResult({ ...testInput, test_type: 'alquran', score: 85 });
            await createTestResult({ ...testInput, test_type: 'hadits', score: 88 });
        });

        it('should return statistics for all test types', async () => {
            const stats = await getTestStatisticsByGenerus(generusId);

            expect(stats.tilawati.total_tests).toBe(2);
            expect(stats.tilawati.average).toBe(85); // (80 + 90) / 2
            expect(stats.alquran.total_tests).toBe(1);
            expect(stats.alquran.average).toBe(85);
            expect(stats.hadits.total_tests).toBe(1);
            expect(stats.hadits.average).toBe(88);
            expect(stats.daily_prayers.total_tests).toBe(0);
            expect(stats.daily_prayers.average).toBe(0);
        });

        it('should return zero statistics for generus with no tests', async () => {
            // Create another generus without test results
            const anotherGenerus = await db.insert(generusTable)
                .values({ ...testGenerus, full_name: 'Another Generus' })
                .returning({ id: generusTable.id })
                .execute();

            const stats = await getTestStatisticsByGenerus(anotherGenerus[0].id);

            expect(stats.tilawati.total_tests).toBe(0);
            expect(stats.tilawati.average).toBe(0);
            expect(stats.alquran.total_tests).toBe(0);
            expect(stats.alquran.average).toBe(0);
            expect(stats.hadits.total_tests).toBe(0);
            expect(stats.hadits.average).toBe(0);
            expect(stats.daily_prayers.total_tests).toBe(0);
            expect(stats.daily_prayers.average).toBe(0);
        });
    });

    describe('getTestSummary', () => {
        beforeEach(async () => {
            // Create test results for different test types
            await createTestResult({ ...testInput, test_type: 'tilawati', score: 80 });
            await createTestResult({ ...testInput, test_type: 'tilawati', score: 90 });
            await createTestResult({ ...testInput, test_type: 'alquran', score: 85 });
            await createTestResult({ ...testInput, test_type: 'hadits', score: 88 });
            await createTestResult({ ...testInput, test_type: 'daily-prayers', score: 92 });
        });

        it('should return overall test summary', async () => {
            const summary = await getTestSummary();

            expect(summary.total_tests).toBe(5);
            expect(summary.average_score).toBe(87); // (80 + 90 + 85 + 88 + 92) / 5

            expect(summary.test_distribution).toHaveLength(4);

            const tilawatiStats = summary.test_distribution.find(d => d.test_type === 'tilawati');
            expect(tilawatiStats!.count).toBe(2);
            expect(tilawatiStats!.average).toBe(85);

            const alquranStats = summary.test_distribution.find(d => d.test_type === 'alquran');
            expect(alquranStats!.count).toBe(1);
            expect(alquranStats!.average).toBe(85);

            const haditsStats = summary.test_distribution.find(d => d.test_type === 'hadits');
            expect(haditsStats!.count).toBe(1);
            expect(haditsStats!.average).toBe(88);

            const prayersStats = summary.test_distribution.find(d => d.test_type === 'daily-prayers');
            expect(prayersStats!.count).toBe(1);
            expect(prayersStats!.average).toBe(92);
        });

        it('should return zero summary when no tests exist', async () => {
            // This test needs a fresh database without the test data created in beforeEach
            await resetDB();
            await createDB();

            // Create only the prerequisite data without test results
            const generusResult = await db.insert(generusTable)
                .values(testGenerus)
                .returning({ id: generusTable.id })
                .execute();
            
            const teacherResult = await db.insert(teachersTable)
                .values(testTeacher)
                .returning({ id: teachersTable.id })
                .execute();

            const summary = await getTestSummary();

            expect(summary.total_tests).toBe(0);
            expect(summary.average_score).toBe(0);
            expect(summary.test_distribution).toHaveLength(4);

            summary.test_distribution.forEach(dist => {
                expect(dist.count).toBe(0);
                expect(dist.average).toBe(0);
            });
        });
    });
});