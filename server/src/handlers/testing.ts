import { db } from '../db';
import { testingTable, generusTable, teachersTable } from '../db/schema';
import { type Testing, type CreateTesting, type TestType } from '../schema';
import { eq, and, SQL, avg, count, desc } from 'drizzle-orm';

// Create test result
export async function createTestResult(input: CreateTesting): Promise<Testing> {
    try {
        // Verify that both generus and teacher exist
        const generus = await db.select()
            .from(generusTable)
            .where(eq(generusTable.id, input.generus_id))
            .limit(1)
            .execute();

        if (generus.length === 0) {
            throw new Error('Generus not found');
        }

        const teacher = await db.select()
            .from(teachersTable)
            .where(eq(teachersTable.id, input.teacher_id))
            .limit(1)
            .execute();

        if (teacher.length === 0) {
            throw new Error('Teacher not found');
        }

        // Insert the test result
        const result = await db.insert(testingTable)
            .values({
                generus_id: input.generus_id,
                test_type: input.test_type,
                score: input.score.toString(), // Convert number to string for numeric column
                notes: input.notes || null,
                teacher_id: input.teacher_id
            })
            .returning()
            .execute();

        const testResult = result[0];
        return {
            ...testResult,
            score: parseFloat(testResult.score) // Convert string back to number
        };
    } catch (error) {
        console.error('Test result creation failed:', error);
        throw error;
    }
}

// Get test results by generus
export async function getTestResultsByGenerus(generusId: number): Promise<Testing[]> {
    try {
        const results = await db.select()
            .from(testingTable)
            .where(eq(testingTable.generus_id, generusId))
            .orderBy(desc(testingTable.created_at))
            .execute();

        return results.map(result => ({
            ...result,
            score: parseFloat(result.score) // Convert string back to number
        }));
    } catch (error) {
        console.error('Fetching test results by generus failed:', error);
        throw error;
    }
}

// Get test results by type
export async function getTestResultsByType(testType: TestType): Promise<Testing[]> {
    try {
        const results = await db.select()
            .from(testingTable)
            .where(eq(testingTable.test_type, testType))
            .orderBy(desc(testingTable.created_at))
            .execute();

        return results.map(result => ({
            ...result,
            score: parseFloat(result.score) // Convert string back to number
        }));
    } catch (error) {
        console.error('Fetching test results by type failed:', error);
        throw error;
    }
}

// Get test results by teacher
export async function getTestResultsByTeacher(teacherId: number): Promise<Testing[]> {
    try {
        const results = await db.select()
            .from(testingTable)
            .where(eq(testingTable.teacher_id, teacherId))
            .orderBy(desc(testingTable.created_at))
            .execute();

        return results.map(result => ({
            ...result,
            score: parseFloat(result.score) // Convert string back to number
        }));
    } catch (error) {
        console.error('Fetching test results by teacher failed:', error);
        throw error;
    }
}

// Get all test results
export async function getAllTestResults(): Promise<Testing[]> {
    try {
        const results = await db.select()
            .from(testingTable)
            .orderBy(desc(testingTable.created_at))
            .execute();

        return results.map(result => ({
            ...result,
            score: parseFloat(result.score) // Convert string back to number
        }));
    } catch (error) {
        console.error('Fetching all test results failed:', error);
        throw error;
    }
}

// Update test result
export async function updateTestResult(testId: number, updates: Partial<CreateTesting>): Promise<Testing | null> {
    try {
        // Check if test result exists
        const existingTest = await db.select()
            .from(testingTable)
            .where(eq(testingTable.id, testId))
            .limit(1)
            .execute();

        if (existingTest.length === 0) {
            return null;
        }

        // If updating generus_id, verify it exists
        if (updates.generus_id) {
            const generus = await db.select()
                .from(generusTable)
                .where(eq(generusTable.id, updates.generus_id))
                .limit(1)
                .execute();

            if (generus.length === 0) {
                throw new Error('Generus not found');
            }
        }

        // If updating teacher_id, verify it exists
        if (updates.teacher_id) {
            const teacher = await db.select()
                .from(teachersTable)
                .where(eq(teachersTable.id, updates.teacher_id))
                .limit(1)
                .execute();

            if (teacher.length === 0) {
                throw new Error('Teacher not found');
            }
        }

        // Prepare update values
        const updateValues: any = {};
        if (updates.generus_id !== undefined) updateValues.generus_id = updates.generus_id;
        if (updates.test_type !== undefined) updateValues.test_type = updates.test_type;
        if (updates.score !== undefined) updateValues.score = updates.score.toString(); // Convert number to string
        if (updates.notes !== undefined) updateValues.notes = updates.notes || null;
        if (updates.teacher_id !== undefined) updateValues.teacher_id = updates.teacher_id;

        // Update the test result
        const result = await db.update(testingTable)
            .set(updateValues)
            .where(eq(testingTable.id, testId))
            .returning()
            .execute();

        if (result.length === 0) {
            return null;
        }

        const updatedTest = result[0];
        return {
            ...updatedTest,
            score: parseFloat(updatedTest.score) // Convert string back to number
        };
    } catch (error) {
        console.error('Test result update failed:', error);
        throw error;
    }
}

// Delete test result
export async function deleteTestResult(testId: number): Promise<{ success: boolean; message: string }> {
    try {
        const result = await db.delete(testingTable)
            .where(eq(testingTable.id, testId))
            .returning({ id: testingTable.id })
            .execute();

        if (result.length === 0) {
            return {
                success: false,
                message: 'Test result not found'
            };
        }

        return {
            success: true,
            message: 'Test result deleted successfully'
        };
    } catch (error) {
        console.error('Test result deletion failed:', error);
        throw error;
    }
}

// Get test statistics for generus
export async function getTestStatisticsByGenerus(generusId: number): Promise<{
    tilawati: { average: number; total_tests: number };
    alquran: { average: number; total_tests: number };
    hadits: { average: number; total_tests: number };
    daily_prayers: { average: number; total_tests: number };
}> {
    try {
        const testTypes: TestType[] = ['tilawati', 'alquran', 'hadits', 'daily-prayers'];
        const statistics: any = {};

        for (const testType of testTypes) {
            const results = await db.select({
                avg_score: avg(testingTable.score),
                total_count: count(testingTable.id)
            })
                .from(testingTable)
                .where(
                    and(
                        eq(testingTable.generus_id, generusId),
                        eq(testingTable.test_type, testType)
                    )
                )
                .execute();

            const result = results[0];
            // Use underscores for property names to match the expected interface
            const propertyName = testType.replace('-', '_');
            statistics[propertyName] = {
                average: result.avg_score ? parseFloat(result.avg_score.toString()) : 0,
                total_tests: parseInt(result.total_count.toString())
            };
        }

        return statistics;
    } catch (error) {
        console.error('Fetching test statistics by generus failed:', error);
        throw error;
    }
}

// Get test summary for dashboard
export async function getTestSummary(): Promise<{
    total_tests: number;
    average_score: number;
    test_distribution: { test_type: string; count: number; average: number }[];
}> {
    try {
        // Get overall statistics
        const overallStats = await db.select({
            total_tests: count(testingTable.id),
            average_score: avg(testingTable.score)
        })
            .from(testingTable)
            .execute();

        const overall = overallStats[0];

        // Get statistics by test type
        const testTypes: TestType[] = ['tilawati', 'alquran', 'hadits', 'daily-prayers'];
        const testDistribution = [];

        for (const testType of testTypes) {
            const typeStats = await db.select({
                count: count(testingTable.id),
                average: avg(testingTable.score)
            })
                .from(testingTable)
                .where(eq(testingTable.test_type, testType))
                .execute();

            const typeStat = typeStats[0];
            testDistribution.push({
                test_type: testType,
                count: parseInt(typeStat.count.toString()),
                average: typeStat.average ? parseFloat(typeStat.average.toString()) : 0
            });
        }

        return {
            total_tests: parseInt(overall.total_tests.toString()),
            average_score: overall.average_score ? parseFloat(overall.average_score.toString()) : 0,
            test_distribution: testDistribution
        };
    } catch (error) {
        console.error('Fetching test summary failed:', error);
        throw error;
    }
}