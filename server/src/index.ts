import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  teacherRegistrationSchema,
  teacherLoginSchema,
  coordinatorLoginSchema,
  generusLoginSchema,
  generusDataInputSchema,
  updateGenerusSchema,
  createKBMReportSchema,
  onlineAttendanceSchema,
  createMaterialInfoSchema,
  createTestingSchema,
  createCriticismSuggestionSchema,
  idParamSchema,
  barcodeParamSchema,
  kbmReportExportFiltersSchema
} from './schema';

// Import handlers
import {
  registerTeacher,
  loginTeacher,
  loginCoordinator,
  loginGenerus,
  logout
} from './handlers/auth';

import {
  getActiveTeachers,
  getTeacherById,
  updateTeacherStatus
} from './handlers/teachers';

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
} from './handlers/generus';

import {
  createKBMReport,
  getAllKBMReports,
  getKBMReportsByTeacher,
  getKBMReportsByDateRange,
  getKBMReportDetails,
  getKBMReportsBySambungGroup,
  updateKBMReport,
  deleteKBMReport,
  exportKBMReportsToExcel
} from './handlers/kbm_reports';

import {
  recordOnlineAttendance,
  getAttendanceByKBMReport,
  getAttendanceByGenerus,
  getOnlineAttendanceBySambungGroup,
  getGenerusAttendanceStats,
  getAttendanceSummary,
  getAttendanceByDateRange,
  updateAttendanceStatus,
  getAllOnlineAttendance
} from './handlers/attendance';

import {
  createMaterialInfo,
  getAllMaterials,
  getMaterialById,
  updateMaterialInfo,
  deleteMaterialInfo,
  uploadMaterialFile,
  getMaterialsByCoordinator,
  downloadMaterial
} from './handlers/materials';

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
} from './handlers/testing';

import {
  createCriticismSuggestion,
  getAllCriticismSuggestions,
  getCriticismSuggestionsByUserType,
  getCriticismSuggestionsByUser,
  getCriticismSuggestionsByDateRange,
  deleteCriticismSuggestion,
  markCriticismSuggestionAsRead,
  getUnreadCriticismSuggestionsCount
} from './handlers/criticism_suggestions';

import {
  getDashboardStats,
  getMonthlyAttendanceData,
  getTeacherDashboardStats,
  getGenerusDashboardStats,
  getRecentActivities,
  getSystemHealth
} from './handlers/dashboard';

import {
  generateGenerusIDCard,
  generateIDCardPDF,
  getIDCardTemplate,
  updateIDCardTemplate,
  validateIDCard,
  getAllIssuedIDCards,
  bulkGenerateIDCards
} from './handlers/id_cards';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  auth: router({
    registerTeacher: publicProcedure
      .input(teacherRegistrationSchema)
      .mutation(({ input }) => registerTeacher(input)),
    
    loginTeacher: publicProcedure
      .input(teacherLoginSchema)
      .mutation(({ input }) => loginTeacher(input)),
    
    loginCoordinator: publicProcedure
      .input(coordinatorLoginSchema)
      .mutation(({ input }) => loginCoordinator(input)),
    
    loginGenerus: publicProcedure
      .input(generusLoginSchema)
      .mutation(({ input }) => loginGenerus(input)),
    
    logout: publicProcedure
      .input(idParamSchema.extend({ userType: teacherRegistrationSchema.pick({ email: true }).transform(() => 'teacher' as const) }))
      .mutation(({ input }) => logout(input.id, 'teacher'))
  }),

  // Teacher management routes
  teachers: router({
    getActive: publicProcedure
      .query(() => getActiveTeachers()),
    
    getById: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getTeacherById(input.id)),
    
    updateStatus: publicProcedure
      .input(idParamSchema.extend({ isActive: teacherRegistrationSchema.pick({ email: true }).transform(() => true) }))
      .mutation(({ input }) => updateTeacherStatus(input.id, input.isActive))
  }),

  // Generus management routes
  generus: router({
    getAll: publicProcedure
      .query(() => getAllGenerus()),
    
    getById: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getGenerusById(input.id)),
    
    getByBarcode: publicProcedure
      .input(barcodeParamSchema)
      .query(({ input }) => getGenerusByBarcode(input.barcode)),
    
    createOrUpdate: publicProcedure
      .input(generusDataInputSchema)
      .mutation(({ input }) => createOrUpdateGenerusData(input)),
    
    update: publicProcedure
      .input(updateGenerusSchema)
      .mutation(({ input }) => updateGenerus(input)),
    
    delete: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => deleteGenerus(input.id)),
    
    getBySambungGroup: publicProcedure
      .input(generusDataInputSchema.pick({ sambung_group: true }))
      .query(({ input }) => getGenerusBySambungGroup(input.sambung_group)),
    
    generateBarcode: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => generateGenerusBarcode(input.id)),
    
    bulkImport: publicProcedure
      .input(teacherRegistrationSchema.pick({ email: true }).transform(() => [] as any[]))
      .mutation(({ input }) => bulkImportGenerus(input))
  }),

  // KBM Reports routes
  kbmReports: router({
    create: publicProcedure
      .input(createKBMReportSchema)
      .mutation(({ input }) => createKBMReport(input)),
    
    getAll: publicProcedure
      .query(() => getAllKBMReports()),
    
    getByTeacher: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getKBMReportsByTeacher(input.id)),
    
    getByDateRange: publicProcedure
      .input(generusDataInputSchema.pick({ sambung_group: true }).transform(() => ({ 
        startDate: new Date(), 
        endDate: new Date() 
      })))
      .query(({ input }) => getKBMReportsByDateRange(input.startDate, input.endDate)),
    
    getDetails: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getKBMReportDetails(input.id)),
    
    getBySambungGroup: publicProcedure
      .input(generusDataInputSchema.pick({ sambung_group: true }))
      .query(({ input }) => getKBMReportsBySambungGroup(input.sambung_group)),
    
    update: publicProcedure
      .input(updateGenerusSchema.pick({ id: true }).merge(createKBMReportSchema.partial()))
      .mutation(({ input }) => updateKBMReport(input.id, input)),
    
    delete: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => deleteKBMReport(input.id)),
    
    exportToExcel: publicProcedure
      .input(kbmReportExportFiltersSchema)
      .query(({ input }) => exportKBMReportsToExcel(input))
  }),

  // Attendance routes
  attendance: router({
    recordOnline: publicProcedure
      .input(onlineAttendanceSchema)
      .mutation(({ input }) => recordOnlineAttendance(input)),
    
    getByKBMReport: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getAttendanceByKBMReport(input.id)),
    
    getByGenerus: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getAttendanceByGenerus(input.id)),
    
    getOnlineBySambungGroup: publicProcedure
      .input(generusDataInputSchema.pick({ sambung_group: true }))
      .query(({ input }) => getOnlineAttendanceBySambungGroup(input.sambung_group)),
    
    getGenerusStats: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getGenerusAttendanceStats(input.id)),
    
    getSummary: publicProcedure
      .query(() => getAttendanceSummary()),
    
    getByDateRange: publicProcedure
      .input(generusDataInputSchema.pick({ sambung_group: true }).transform(() => ({ 
        startDate: new Date(), 
        endDate: new Date() 
      })))
      .query(({ input }) => getAttendanceByDateRange(input.startDate, input.endDate)),
    
    updateStatus: publicProcedure
      .input(idParamSchema.extend({ 
        status: createKBMReportSchema.shape.generus_attendance.element.shape.status 
      }))
      .mutation(({ input }) => updateAttendanceStatus(input.id, input.status)),
    
    getAllOnline: publicProcedure
      .query(() => getAllOnlineAttendance())
  }),

  // Materials routes
  materials: router({
    create: publicProcedure
      .input(createMaterialInfoSchema)
      .mutation(({ input }) => createMaterialInfo(input)),
    
    getAll: publicProcedure
      .query(() => getAllMaterials()),
    
    getById: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getMaterialById(input.id)),
    
    update: publicProcedure
      .input(updateGenerusSchema.pick({ id: true }).merge(createMaterialInfoSchema.partial()))
      .mutation(({ input }) => updateMaterialInfo(input.id, input)),
    
    delete: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => deleteMaterialInfo(input.id)),
    
    uploadFile: publicProcedure
      .input(idParamSchema.extend({ file: teacherRegistrationSchema.pick({ email: true }).transform(() => ({})) }))
      .mutation(({ input }) => uploadMaterialFile(input.id, input.file)),
    
    getByCoordinator: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getMaterialsByCoordinator(input.id)),
    
    download: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => downloadMaterial(input.id))
  }),

  // Testing routes
  testing: router({
    createResult: publicProcedure
      .input(createTestingSchema)
      .mutation(({ input }) => createTestResult(input)),
    
    getByGenerus: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getTestResultsByGenerus(input.id)),
    
    getByType: publicProcedure
      .input(createTestingSchema.pick({ test_type: true }))
      .query(({ input }) => getTestResultsByType(input.test_type)),
    
    getByTeacher: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getTestResultsByTeacher(input.id)),
    
    getAll: publicProcedure
      .query(() => getAllTestResults()),
    
    update: publicProcedure
      .input(updateGenerusSchema.pick({ id: true }).merge(createTestingSchema.partial()))
      .mutation(({ input }) => updateTestResult(input.id, input)),
    
    delete: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => deleteTestResult(input.id)),
    
    getStatsByGenerus: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getTestStatisticsByGenerus(input.id)),
    
    getSummary: publicProcedure
      .query(() => getTestSummary())
  }),

  // Criticism and Suggestions routes
  criticismSuggestions: router({
    create: publicProcedure
      .input(createCriticismSuggestionSchema)
      .mutation(({ input }) => createCriticismSuggestion(input)),
    
    getAll: publicProcedure
      .query(() => getAllCriticismSuggestions()),
    
    getByUserType: publicProcedure
      .input(createCriticismSuggestionSchema.pick({ user_type: true }))
      .query(({ input }) => getCriticismSuggestionsByUserType(input.user_type)),
    
    getByUser: publicProcedure
      .input(createCriticismSuggestionSchema.pick({ user_id: true, user_type: true }))
      .query(({ input }) => getCriticismSuggestionsByUser(input.user_id, input.user_type)),
    
    getByDateRange: publicProcedure
      .input(generusDataInputSchema.pick({ sambung_group: true }).transform(() => ({ 
        startDate: new Date(), 
        endDate: new Date() 
      })))
      .query(({ input }) => getCriticismSuggestionsByDateRange(input.startDate, input.endDate)),
    
    delete: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => deleteCriticismSuggestion(input.id)),
    
    markAsRead: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => markCriticismSuggestionAsRead(input.id)),
    
    getUnreadCount: publicProcedure
      .query(() => getUnreadCriticismSuggestionsCount())
  }),

  // Dashboard routes
  dashboard: router({
    getStats: publicProcedure
      .query(() => getDashboardStats()),
    
    getMonthlyAttendance: publicProcedure
      .input(idParamSchema.pick({ id: true }).optional())
      .query(({ input }) => getMonthlyAttendanceData(input?.id)),
    
    getTeacherStats: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getTeacherDashboardStats(input.id)),
    
    getGenerusStats: publicProcedure
      .input(idParamSchema)
      .query(({ input }) => getGenerusDashboardStats(input.id)),
    
    getRecentActivities: publicProcedure
      .input(idParamSchema.pick({ id: true }).optional())
      .query(({ input }) => getRecentActivities(input?.id || 10)),
    
    getSystemHealth: publicProcedure
      .query(() => getSystemHealth())
  }),

  // ID Cards routes
  idCards: router({
    generate: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => generateGenerusIDCard(input.id)),
    
    generatePDF: publicProcedure
      .input(idParamSchema)
      .mutation(({ input }) => generateIDCardPDF(input.id)),
    
    getTemplate: publicProcedure
      .query(() => getIDCardTemplate()),
    
    updateTemplate: publicProcedure
      .input(teacherRegistrationSchema.pick({ name: true }).transform(() => ({
        header_text: 'Updated header',
        footer_text: 'Updated footer'
      })))
      .mutation(({ input }) => updateIDCardTemplate(input)),
    
    validate: publicProcedure
      .input(barcodeParamSchema.pick({ barcode: true }).transform(data => data.barcode))
      .query(({ input }) => validateIDCard(input)),
    
    getAllIssued: publicProcedure
      .query(() => getAllIssuedIDCards()),
    
    bulkGenerate: publicProcedure
      .input(teacherRegistrationSchema.pick({ email: true }).transform(() => [1, 2, 3] as number[]))
      .mutation(({ input }) => bulkGenerateIDCards(input))
  })
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`🚀 Generus Attendance Management System TRPC server listening at port: ${port}`);
  console.log(`📚 Aplikasi Kehadiran Generus - Generasi Penerus Jama'ah - Desa Situbondo Barat (de Sind'rat) - Tahun 2025`);
}

start();