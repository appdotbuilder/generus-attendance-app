import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable, coordinatorsTable, generusTable } from '../db/schema';
import { registerTeacher, loginTeacher, loginCoordinator, loginGenerus, logout } from '../handlers/auth';
import { type TeacherRegistration, type TeacherLogin, type CoordinatorLogin, type GenerusLogin } from '../schema';
import { eq } from 'drizzle-orm';


// Test data
const teacherRegistrationData: TeacherRegistration = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  username: 'johndoe',
  password: 'password123'
};

const teacherLoginData: TeacherLogin = {
  email: 'john.doe@example.com',
  password: 'password123',
  remember_me: true
};

const coordinatorLoginData: CoordinatorLogin = {
  name: 'Main Coordinator',
  access_code: 'COORD2024'
};

const generusLoginData: GenerusLogin = {
  full_name: 'Ahmad Ibrahim',
  level: 'remaja',
  sambung_group: 'A1'
};

describe('Authentication Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('registerTeacher', () => {
    it('should register a new teacher successfully', async () => {
      const result = await registerTeacher(teacherRegistrationData);

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Teacher registered successfully');
      expect(result.teacher).toBeDefined();
      expect(result.teacher?.name).toEqual('John Doe');
      expect(result.teacher?.email).toEqual('john.doe@example.com');
      expect(result.teacher?.username).toEqual('johndoe');
      expect(result.teacher?.is_active).toBe(true);
      expect(result.teacher?.id).toBeDefined();
      expect(result.teacher?.created_at).toBeInstanceOf(Date);
    });

    it('should save teacher to database with hashed password', async () => {
      const result = await registerTeacher(teacherRegistrationData);

      const teachers = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, result.teacher!.id))
        .execute();

      expect(teachers).toHaveLength(1);
      expect(teachers[0].name).toEqual('John Doe');
      expect(teachers[0].email).toEqual('john.doe@example.com');
      expect(teachers[0].password_hash).not.toEqual('password123');
      expect(teachers[0].password_hash.length).toBeGreaterThan(20); // Hashed password should be longer
    });

    it('should reject duplicate email', async () => {
      // Register first teacher
      await registerTeacher(teacherRegistrationData);

      // Try to register another teacher with same email
      const duplicateData = {
        ...teacherRegistrationData,
        username: 'differentusername'
      };

      const result = await registerTeacher(duplicateData);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Email already registered');
      expect(result.teacher).toBeUndefined();
    });

    it('should reject duplicate username', async () => {
      // Register first teacher
      await registerTeacher(teacherRegistrationData);

      // Try to register another teacher with same username
      const duplicateData = {
        ...teacherRegistrationData,
        email: 'different@example.com'
      };

      const result = await registerTeacher(duplicateData);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Username already taken');
      expect(result.teacher).toBeUndefined();
    });
  });

  describe('loginTeacher', () => {
    beforeEach(async () => {
      // Create a teacher for login tests
      await registerTeacher(teacherRegistrationData);
    });

    it('should login teacher with valid credentials', async () => {
      const result = await loginTeacher(teacherLoginData);

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Login successful');
      expect(result.teacher).toBeDefined();
      expect(result.teacher?.email).toEqual('john.doe@example.com');
      expect(result.teacher?.name).toEqual('John Doe');
    });

    it('should reject invalid email', async () => {
      const invalidLogin = {
        ...teacherLoginData,
        email: 'nonexistent@example.com'
      };

      const result = await loginTeacher(invalidLogin);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Invalid email or password');
      expect(result.teacher).toBeUndefined();
    });

    it('should reject invalid password', async () => {
      const invalidLogin = {
        ...teacherLoginData,
        password: 'wrongpassword'
      };

      const result = await loginTeacher(invalidLogin);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Invalid email or password');
      expect(result.teacher).toBeUndefined();
    });

    it('should reject inactive teacher', async () => {
      // Deactivate the teacher
      const teachers = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.email, teacherLoginData.email))
        .execute();

      await db.update(teachersTable)
        .set({ is_active: false })
        .where(eq(teachersTable.id, teachers[0].id))
        .execute();

      const result = await loginTeacher(teacherLoginData);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Account is inactive');
      expect(result.teacher).toBeUndefined();
    });
  });

  describe('loginCoordinator', () => {
    beforeEach(async () => {
      // Create a coordinator for login tests
      await db.insert(coordinatorsTable)
        .values({
          name: coordinatorLoginData.name,
          access_code: coordinatorLoginData.access_code
        })
        .execute();
    });

    it('should login coordinator with valid credentials', async () => {
      const result = await loginCoordinator(coordinatorLoginData);

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Coordinator login successful');
      expect(result.coordinator).toBeDefined();
      expect(result.coordinator?.name).toEqual('Main Coordinator');
      expect(result.coordinator?.access_code).toEqual('COORD2024');
      expect(result.coordinator?.is_active).toBe(true);
    });

    it('should reject invalid name', async () => {
      const invalidLogin = {
        ...coordinatorLoginData,
        name: 'Wrong Name'
      };

      const result = await loginCoordinator(invalidLogin);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Invalid name or access code');
      expect(result.coordinator).toBeUndefined();
    });

    it('should reject invalid access code', async () => {
      const invalidLogin = {
        ...coordinatorLoginData,
        access_code: 'WRONGCODE'
      };

      const result = await loginCoordinator(invalidLogin);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Invalid name or access code');
      expect(result.coordinator).toBeUndefined();
    });

    it('should reject inactive coordinator', async () => {
      // Deactivate the coordinator
      await db.update(coordinatorsTable)
        .set({ is_active: false })
        .where(eq(coordinatorsTable.name, coordinatorLoginData.name))
        .execute();

      const result = await loginCoordinator(coordinatorLoginData);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Account is inactive');
      expect(result.coordinator).toBeUndefined();
    });
  });

  describe('loginGenerus', () => {
    beforeEach(async () => {
      // Create a generus for login tests
      await db.insert(generusTable)
        .values({
          full_name: generusLoginData.full_name,
          level: generusLoginData.level,
          sambung_group: generusLoginData.sambung_group
        })
        .execute();
    });

    it('should login generus with valid credentials', async () => {
      const result = await loginGenerus(generusLoginData);

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Generus login successful');
      expect(result.generus).toBeDefined();
      expect(result.generus?.full_name).toEqual('Ahmad Ibrahim');
      expect(result.generus?.level).toEqual('remaja');
      expect(result.generus?.sambung_group).toEqual('A1');
      expect(result.generus?.is_active).toBe(true);
    });

    it('should reject invalid full name', async () => {
      const invalidLogin = {
        ...generusLoginData,
        full_name: 'Wrong Name'
      };

      const result = await loginGenerus(invalidLogin);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Invalid credentials. Please check your full name, level, and sambung group');
      expect(result.generus).toBeUndefined();
    });

    it('should reject invalid level', async () => {
      const invalidLogin = {
        ...generusLoginData,
        level: 'pra-remaja' as const
      };

      const result = await loginGenerus(invalidLogin);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Invalid credentials. Please check your full name, level, and sambung group');
      expect(result.generus).toBeUndefined();
    });

    it('should reject invalid sambung group', async () => {
      const invalidLogin = {
        ...generusLoginData,
        sambung_group: 'B2'
      };

      const result = await loginGenerus(invalidLogin);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Invalid credentials. Please check your full name, level, and sambung group');
      expect(result.generus).toBeUndefined();
    });

    it('should reject inactive generus', async () => {
      // Deactivate the generus
      await db.update(generusTable)
        .set({ is_active: false })
        .where(eq(generusTable.full_name, generusLoginData.full_name))
        .execute();

      const result = await loginGenerus(generusLoginData);

      expect(result.success).toBe(false);
      expect(result.message).toEqual('Account is inactive');
      expect(result.generus).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('should logout teacher successfully', async () => {
      const result = await logout(1, 'teacher');

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Logged out successfully');
    });

    it('should logout coordinator successfully', async () => {
      const result = await logout(1, 'coordinator');

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Logged out successfully');
    });

    it('should logout generus successfully', async () => {
      const result = await logout(1, 'generus');

      expect(result.success).toBe(true);
      expect(result.message).toEqual('Logged out successfully');
    });
  });
});