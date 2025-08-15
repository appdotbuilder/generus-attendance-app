import { type GuruPengajar } from '../schema';

export async function getGuruPengajarList(): Promise<GuruPengajar[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch all registered Guru Pengajar.
  // Used by Koordinator in dashboard to view all registered teachers.
  return Promise.resolve([]);
}

export async function getGuruPengajarById(id: number): Promise<GuruPengajar | null> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch specific Guru Pengajar by ID.
  // Used for profile management and session validation.
  return Promise.resolve(null);
}

export async function updateGuruPengajar(input: {
  id: number;
  nama_lengkap?: string;
  email?: string;
  username?: string;
}): Promise<GuruPengajar> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to update Guru Pengajar profile information.
  // Should validate unique email/username constraints.
  return Promise.resolve({
    id: input.id,
    nama_lengkap: input.nama_lengkap || "Updated Teacher",
    email: input.email || "updated@teacher.com",
    username: input.username || "updated_teacher",
    password: "hashed_password",
    created_at: new Date(),
    updated_at: new Date()
  });
}

export async function changeGuruPassword(input: {
  id: number;
  current_password: string;
  new_password: string;
}): Promise<{ success: boolean; message: string }> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to change Guru Pengajar password.
  // Should verify current password and hash new password before saving.
  return Promise.resolve({
    success: true,
    message: "Password berhasil diubah"
  });
}

export async function getGuruStatistik(guruId: number): Promise<{
  total_laporan: number;
  total_materi_diajarkan: number;
  total_generus_diajar: number;
  rata_rata_kehadiran: number;
}> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to calculate teacher's activity statistics.
  // Used in Guru dashboard to show personal teaching performance.
  return Promise.resolve({
    total_laporan: 0,
    total_materi_diajarkan: 0,
    total_generus_diajar: 0,
    rata_rata_kehadiran: 0
  });
}