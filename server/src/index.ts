import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  loginGenerusInputSchema,
  registerGuruPengajarInputSchema,
  loginGuruPengajarInputSchema,
  loginKoordinatorInputSchema,
  createGenerusInputSchema,
  updateGenerusInputSchema,
  createLaporanKbmInputSchema,
  rekapanLaporanFilterSchema,
  createMateriInputSchema,
  scanBarcodeInputSchema
} from './schema';

// Import handlers
import { loginGenerus, registerGuruPengajar, loginGuruPengajar, loginKoordinator } from './handlers/auth';
import { 
  createGenerus, 
  updateGenerus, 
  getGenerusList, 
  getGenerusById, 
  deleteGenerus,
  getGenerusByBarcode 
} from './handlers/generus';
import { 
  createLaporanKbm,
  getLaporanKbmList,
  getLaporanKbmWithKehadiran,
  getStatistikKehadiran,
  getKehadiranByGenerus,
  getGrafikKehadiranBulanan
} from './handlers/laporan_kbm';
import { 
  createMateri,
  getMateriList,
  getMateriById,
  updateMateri,
  deleteMateri,
  uploadMateriFile
} from './handlers/materi';
import { 
  scanBarcodeAbsensi,
  getAbsensiOnlineList,
  getAbsensiByGenerus,
  getAbsensiStatistik,
  generateBarcodeForGenerus
} from './handlers/absensi_online';
import { 
  getGuruPengajarList,
  getGuruPengajarById,
  updateGuruPengajar,
  changeGuruPassword,
  getGuruStatistik
} from './handlers/guru_pengajar';
import { 
  getWhatsAppLink,
  createKritikSaran,
  getKritikSaranList
} from './handlers/kritik_saran';
import { 
  createPengetesan,
  getPengetesanByGenerus,
  getPengetesanList,
  updatePengetesan,
  deletePengetesan
} from './handlers/pengetesan';

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
    loginGenerus: publicProcedure
      .input(loginGenerusInputSchema)
      .mutation(({ input }) => loginGenerus(input)),
    
    registerGuruPengajar: publicProcedure
      .input(registerGuruPengajarInputSchema)
      .mutation(({ input }) => registerGuruPengajar(input)),
    
    loginGuruPengajar: publicProcedure
      .input(loginGuruPengajarInputSchema)
      .mutation(({ input }) => loginGuruPengajar(input)),
    
    loginKoordinator: publicProcedure
      .input(loginKoordinatorInputSchema)
      .mutation(({ input }) => loginKoordinator(input))
  }),

  // Generus management routes
  generus: router({
    create: publicProcedure
      .input(createGenerusInputSchema)
      .mutation(({ input }) => createGenerus(input)),
    
    update: publicProcedure
      .input(updateGenerusInputSchema)
      .mutation(({ input }) => updateGenerus(input)),
    
    list: publicProcedure
      .query(() => getGenerusList()),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getGenerusById(input)),
    
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteGenerus(input)),
    
    getByBarcode: publicProcedure
      .input(z.string())
      .query(({ input }) => getGenerusByBarcode(input)),
    
    generateBarcode: publicProcedure
      .input(z.number())
      .mutation(({ input }) => generateBarcodeForGenerus(input))
  }),

  // KBM Report routes
  laporanKbm: router({
    create: publicProcedure
      .input(createLaporanKbmInputSchema)
      .mutation(({ input }) => createLaporanKbm(input)),
    
    list: publicProcedure
      .input(rekapanLaporanFilterSchema.optional())
      .query(({ input }) => getLaporanKbmList(input)),
    
    getWithKehadiran: publicProcedure
      .input(z.number())
      .query(({ input }) => getLaporanKbmWithKehadiran(input)),
    
    getStatistik: publicProcedure
      .input(rekapanLaporanFilterSchema.optional())
      .query(({ input }) => getStatistikKehadiran(input)),
    
    getKehadiranByGenerus: publicProcedure
      .input(z.string())
      .query(({ input }) => getKehadiranByGenerus(input)),
    
    getGrafikBulanan: publicProcedure
      .input(rekapanLaporanFilterSchema.optional())
      .query(({ input }) => getGrafikKehadiranBulanan(input))
  }),

  // Material management routes
  materi: router({
    create: publicProcedure
      .input(createMateriInputSchema)
      .mutation(({ input }) => createMateri(input)),
    
    list: publicProcedure
      .query(() => getMateriList()),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getMateriById(input)),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        judul: z.string().optional(),
        deskripsi: z.string().optional(),
        link_url: z.string().nullable().optional(),
        file_url: z.string().nullable().optional()
      }))
      .mutation(({ input }) => updateMateri(input)),
    
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteMateri(input))
  }),

  // Online attendance routes
  absensiOnline: router({
    scanBarcode: publicProcedure
      .input(scanBarcodeInputSchema)
      .mutation(({ input }) => scanBarcodeAbsensi(input)),
    
    list: publicProcedure
      .input(z.object({
        tanggal: z.coerce.date().optional(),
        kelompok_sambung: z.string().optional()
      }).optional())
      .query(({ input }) => getAbsensiOnlineList(input)),
    
    getByGenerus: publicProcedure
      .input(z.number())
      .query(({ input }) => getAbsensiByGenerus(input)),
    
    getStatistik: publicProcedure
      .input(z.object({
        bulan: z.number().optional(),
        tahun: z.number().optional(),
        kelompok_sambung: z.string().optional()
      }).optional())
      .query(({ input }) => getAbsensiStatistik(input))
  }),

  // Teacher management routes
  guruPengajar: router({
    list: publicProcedure
      .query(() => getGuruPengajarList()),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getGuruPengajarById(input)),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nama_lengkap: z.string().optional(),
        email: z.string().email().optional(),
        username: z.string().optional()
      }))
      .mutation(({ input }) => updateGuruPengajar(input)),
    
    changePassword: publicProcedure
      .input(z.object({
        id: z.number(),
        current_password: z.string(),
        new_password: z.string().min(6)
      }))
      .mutation(({ input }) => changeGuruPassword(input)),
    
    getStatistik: publicProcedure
      .input(z.number())
      .query(({ input }) => getGuruStatistik(input))
  }),

  // Feedback routes
  kritikSaran: router({
    getWhatsAppLink: publicProcedure
      .query(() => getWhatsAppLink()),
    
    create: publicProcedure
      .input(z.object({
        nama: z.string(),
        pesan: z.string(),
        kategori: z.string().optional()
      }))
      .mutation(({ input }) => createKritikSaran(input)),
    
    list: publicProcedure
      .query(() => getKritikSaranList())
  }),

  // Testing/Assessment routes
  pengetesan: router({
    create: publicProcedure
      .input(z.object({
        generus_id: z.number(),
        jenis_pengetesan: z.enum(['Tilawati', 'Al-Qur\'an', 'Al-Hadits', 'Do\'a-Do\'a Harian']),
        nilai: z.number().min(0).max(100),
        keterangan: z.string().optional(),
        guru_penguji_id: z.number()
      }))
      .mutation(({ input }) => createPengetesan(input)),
    
    getByGenerus: publicProcedure
      .input(z.number())
      .query(({ input }) => getPengetesanByGenerus(input)),
    
    list: publicProcedure
      .input(z.object({
        jenis_pengetesan: z.enum(['Tilawati', 'Al-Qur\'an', 'Al-Hadits', 'Do\'a-Do\'a Harian']).optional(),
        kelompok_sambung: z.string().optional(),
        jenjang: z.string().optional()
      }).optional())
      .query(({ input }) => getPengetesanList(input)),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nilai: z.number().min(0).max(100).optional(),
        keterangan: z.string().optional()
      }))
      .mutation(({ input }) => updatePengetesan(input)),
    
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deletePengetesan(input))
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
  console.log(`TRPC server listening at port: ${port}`);
}

start();