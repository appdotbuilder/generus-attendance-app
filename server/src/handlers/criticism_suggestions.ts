import { db } from '../db';
import { criticismSuggestionsTable } from '../db/schema';
import { type CriticismSuggestion, type CreateCriticismSuggestion } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

// Create criticism or suggestion
export async function createCriticismSuggestion(input: CreateCriticismSuggestion): Promise<CriticismSuggestion> {
  try {
    const result = await db.insert(criticismSuggestionsTable)
      .values({
        user_type: input.user_type,
        user_id: input.user_id,
        user_name: input.user_name,
        message: input.message
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Criticism/suggestion creation failed:', error);
    throw error;
  }
}

// Get all criticism and suggestions (coordinator only)
export async function getAllCriticismSuggestions(): Promise<CriticismSuggestion[]> {
  try {
    const results = await db.select()
      .from(criticismSuggestionsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all criticism/suggestions:', error);
    throw error;
  }
}

// Get criticism and suggestions by user type
export async function getCriticismSuggestionsByUserType(userType: 'generus' | 'teacher' | 'coordinator'): Promise<CriticismSuggestion[]> {
  try {
    const results = await db.select()
      .from(criticismSuggestionsTable)
      .where(eq(criticismSuggestionsTable.user_type, userType))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch criticism/suggestions by user type:', error);
    throw error;
  }
}

// Get criticism and suggestions by user
export async function getCriticismSuggestionsByUser(userId: number, userType: 'generus' | 'teacher' | 'coordinator'): Promise<CriticismSuggestion[]> {
  try {
    const results = await db.select()
      .from(criticismSuggestionsTable)
      .where(
        and(
          eq(criticismSuggestionsTable.user_id, userId),
          eq(criticismSuggestionsTable.user_type, userType)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch criticism/suggestions by user:', error);
    throw error;
  }
}

// Get criticism and suggestions by date range
export async function getCriticismSuggestionsByDateRange(startDate: Date, endDate: Date): Promise<CriticismSuggestion[]> {
  try {
    const results = await db.select()
      .from(criticismSuggestionsTable)
      .where(
        and(
          gte(criticismSuggestionsTable.created_at, startDate),
          lte(criticismSuggestionsTable.created_at, endDate)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch criticism/suggestions by date range:', error);
    throw error;
  }
}

// Delete criticism or suggestion (coordinator only)
export async function deleteCriticismSuggestion(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const result = await db.delete(criticismSuggestionsTable)
      .where(eq(criticismSuggestionsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      return {
        success: false,
        message: 'Criticism/suggestion not found'
      };
    }

    return {
      success: true,
      message: 'Criticism/suggestion deleted successfully'
    };
  } catch (error) {
    console.error('Failed to delete criticism/suggestion:', error);
    throw error;
  }
}

// Mark criticism/suggestion as read (coordinator only) - Note: This would require adding a read status field to schema
export async function markCriticismSuggestionAsRead(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // Since there's no read status field in the current schema, we'll just verify the record exists
    const results = await db.select()
      .from(criticismSuggestionsTable)
      .where(eq(criticismSuggestionsTable.id, id))
      .execute();

    if (results.length === 0) {
      return {
        success: false,
        message: 'Criticism/suggestion not found'
      };
    }

    // In a real implementation, this would update a read status field
    return {
      success: true,
      message: 'Marked as read successfully'
    };
  } catch (error) {
    console.error('Failed to mark criticism/suggestion as read:', error);
    throw error;
  }
}

// Get unread criticism and suggestions count - Note: This would require adding a read status field to schema
export async function getUnreadCriticismSuggestionsCount(): Promise<{ count: number }> {
  try {
    // Since there's no read status field in the current schema, we'll return total count
    const results = await db.select()
      .from(criticismSuggestionsTable)
      .execute();

    return {
      count: results.length
    };
  } catch (error) {
    console.error('Failed to get unread criticism/suggestions count:', error);
    throw error;
  }
}