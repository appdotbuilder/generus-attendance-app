import { db } from '../db';
import { teachersTable, coordinatorsTable, generusTable } from '../db/schema';
import { type TeacherRegistration, type TeacherLogin, type CoordinatorLogin, type GenerusLogin, type Teacher, type Coordinator, type Generus } from '../schema';
import { eq, and } from 'drizzle-orm';


// Teacher authentication handlers
export async function registerTeacher(input: TeacherRegistration): Promise<{ success: boolean; message: string; teacher?: Teacher }> {
  try {
    // Check if email already exists
    const existingEmail = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.email, input.email))
      .execute();

    if (existingEmail.length > 0) {
      return {
        success: false,
        message: 'Email already registered'
      };
    }

    // Check if username already exists
    const existingUsername = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.username, input.username))
      .execute();

    if (existingUsername.length > 0) {
      return {
        success: false,
        message: 'Username already taken'
      };
    }

    // Hash password
    const passwordHash = await Bun.password.hash(input.password);

    // Insert new teacher
    const result = await db.insert(teachersTable)
      .values({
        name: input.name,
        email: input.email,
        username: input.username,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    const teacher = result[0];

    return {
      success: true,
      message: 'Teacher registered successfully',
      teacher
    };
  } catch (error) {
    console.error('Teacher registration failed:', error);
    return {
      success: false,
      message: 'Registration failed'
    };
  }
}

export async function loginTeacher(input: TeacherLogin): Promise<{ success: boolean; message: string; teacher?: Teacher }> {
  try {
    // Find teacher by email
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.email, input.email))
      .execute();

    if (teachers.length === 0) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    const teacher = teachers[0];

    // Check if account is active
    if (!teacher.is_active) {
      return {
        success: false,
        message: 'Account is inactive'
      };
    }

    // Verify password
    const isValidPassword = await Bun.password.verify(input.password, teacher.password_hash);
    
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    return {
      success: true,
      message: 'Login successful',
      teacher
    };
  } catch (error) {
    console.error('Teacher login failed:', error);
    return {
      success: false,
      message: 'Login failed'
    };
  }
}

// Coordinator authentication handlers
export async function loginCoordinator(input: CoordinatorLogin): Promise<{ success: boolean; message: string; coordinator?: Coordinator }> {
  try {
    // Find coordinator by name and access code
    const coordinators = await db.select()
      .from(coordinatorsTable)
      .where(
        and(
          eq(coordinatorsTable.name, input.name),
          eq(coordinatorsTable.access_code, input.access_code)
        )
      )
      .execute();

    if (coordinators.length === 0) {
      return {
        success: false,
        message: 'Invalid name or access code'
      };
    }

    const coordinator = coordinators[0];

    // Check if account is active
    if (!coordinator.is_active) {
      return {
        success: false,
        message: 'Account is inactive'
      };
    }

    return {
      success: true,
      message: 'Coordinator login successful',
      coordinator
    };
  } catch (error) {
    console.error('Coordinator login failed:', error);
    return {
      success: false,
      message: 'Login failed'
    };
  }
}

// Generus authentication handlers
export async function loginGenerus(input: GenerusLogin): Promise<{ success: boolean; message: string; generus?: Generus }> {
  try {
    // Find generus by full name, level, and sambung group
    const generiList = await db.select()
      .from(generusTable)
      .where(
        and(
          eq(generusTable.full_name, input.full_name),
          eq(generusTable.level, input.level),
          eq(generusTable.sambung_group, input.sambung_group)
        )
      )
      .execute();

    if (generiList.length === 0) {
      return {
        success: false,
        message: 'Invalid credentials. Please check your full name, level, and sambung group'
      };
    }

    const generus = generiList[0];

    // Check if account is active
    if (!generus.is_active) {
      return {
        success: false,
        message: 'Account is inactive'
      };
    }

    return {
      success: true,
      message: 'Generus login successful',
      generus
    };
  } catch (error) {
    console.error('Generus login failed:', error);
    return {
      success: false,
      message: 'Login failed'
    };
  }
}

// Logout handler
export async function logout(userId: number, userType: 'teacher' | 'coordinator' | 'generus'): Promise<{ success: boolean; message: string }> {
  try {
    // For now, logout is just a success response
    // In a real application, this might clear session tokens, update last_logout timestamp, etc.
    console.log(`User ${userId} of type ${userType} logged out`);
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout failed:', error);
    return {
      success: false,
      message: 'Logout failed'
    };
  }
}