import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Plus, Trash2, Users, Calendar, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import type { CreateKBMReport, Generus, Level, AttendanceStatus } from '../../../../server/src/schema';

interface KBMReportFormProps {
  teacherId: number;
  teacherName: string;
}

interface AttendanceItem {
  generus_id: number;
  full_name: string;
  status: AttendanceStatus;
}

export function KBMReportForm({ teacherId, teacherName }: KBMReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generusList, setGenerusList] = useState<Generus[]>([]);
  const [filteredGenerus, setFilteredGenerus] = useState<Generus[]>([]);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [formData, setFormData] = useState<CreateKBMReport>({
    day_date: new Date(),
    sambung_group: '',
    teacher_id: teacherId,
    teacher_name: teacherName,
    level: 'pra-remaja',
    material: '',
    notes: '',
    generus_attendance: []
  });

  const [selectedGenerus, setSelectedGenerus] = useState<Set<number>>(new Set());

  // Load generus data
  const loadGenerus = useCallback(async () => {
    try {
      const data = await trpc.generus.getAll.query();
      setGenerusList(data);
    } catch (error) {
      console.error('Failed to load generus:', error);
      showAlert('error', 'Gagal memuat data generus');
    }
  }, []);

  useEffect(() => {
    loadGenerus();
  }, [loadGenerus]);

  // Filter generus by sambung group and level
  useEffect(() => {
    if (formData.sambung_group && formData.level) {
      const filtered = generusList.filter(g => 
        g.sambung_group === formData.sambung_group && 
        g.level === formData.level &&
        g.is_active
      );
      setFilteredGenerus(filtered);
      
      // Auto-add filtered generus to attendance if not already added
      const currentIds = new Set(formData.generus_attendance.map(a => a.generus_id));
      const newAttendance = filtered
        .filter(g => !currentIds.has(g.id))
        .map(g => ({
          generus_id: g.id,
          full_name: g.full_name,
          status: 'present' as AttendanceStatus
        }));
      
      if (newAttendance.length > 0) {
        setFormData(prev => ({
          ...prev,
          generus_attendance: [...prev.generus_attendance, ...newAttendance]
        }));
      }
    } else {
      setFilteredGenerus([]);
    }
  }, [formData.sambung_group, formData.level, generusList]);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.generus_attendance.length === 0) {
      showAlert('error', 'Minimal harus ada satu generus dalam daftar kehadiran');
      return;
    }

    setIsLoading(true);
    try {
      await trpc.kbmReports.create.mutate(formData);
      showAlert('success', 'Laporan KBM berhasil disimpan!');
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        day_date: new Date(),
        material: '',
        notes: '',
        generus_attendance: []
      }));
      setSelectedGenerus(new Set());
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal menyimpan laporan KBM');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAttendanceStatus = (generusId: number, status: AttendanceStatus) => {
    setFormData(prev => ({
      ...prev,
      generus_attendance: prev.generus_attendance.map(attendance =>
        attendance.generus_id === generusId
          ? { ...attendance, status }
          : attendance
      )
    }));
  };

  const removeFromAttendance = (generusId: number) => {
    setFormData(prev => ({
      ...prev,
      generus_attendance: prev.generus_attendance.filter(a => a.generus_id !== generusId)
    }));
    setSelectedGenerus(prev => {
      const newSet = new Set(prev);
      newSet.delete(generusId);
      return newSet;
    });
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'sick': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'permitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'sick': return 'Sakit';
      case 'permitted': return 'Izin';
      case 'absent': return 'Alpha';
      default: return status;
    }
  };

  // Get unique sambung groups
  const sambungGroups = [...new Set(generusList.map(g => g.sambung_group))].sort();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Laporan Kegiatan Belajar Mengajar (KBM)
          </CardTitle>
          <CardDescription>
            Input laporan KBM dan daftar kehadiran generus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alert && (
            <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              {alert.type === 'error' ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
              <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {alert.message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="day_date">Hari & Tanggal</Label>
                <Input
                  id="day_date"
                  type="date"
                  value={formData.day_date.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    day_date: new Date(e.target.value) 
                  }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="teacher_name">Nama Guru</Label>
                <Input
                  id="teacher_name"
                  value={formData.teacher_name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    teacher_name: e.target.value 
                  }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sambung_group">Sambung Group</Label>
                <Select 
                  value={formData.sambung_group} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    sambung_group: value,
                    generus_attendance: [] // Reset attendance when changing group
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sambung group" />
                  </SelectTrigger>
                  <SelectContent>
                    {sambungGroups.map((group) => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="level">Level</Label>
                <Select 
                  value={formData.level} 
                  onValueChange={(value: Level) => setFormData(prev => ({ 
                    ...prev, 
                    level: value,
                    generus_attendance: [] // Reset attendance when changing level
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pra-remaja">Pra-Remaja</SelectItem>
                    <SelectItem value="remaja">Remaja</SelectItem>
                    <SelectItem value="usia-mandiri-kuliah">Usia Mandiri/Kuliah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="material">Materi</Label>
              <Input
                id="material"
                placeholder="Masukkan materi yang diajarkan"
                value={formData.material}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  material: e.target.value 
                }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan khusus jika diperlukan"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  notes: e.target.value || '' 
                }))}
                rows={3}
              />
            </div>

            {/* Attendance Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Daftar Kehadiran Generus
                </h3>
                <Badge variant="outline">
                  {formData.generus_attendance.length} generus terdaftar
                </Badge>
              </div>

              {formData.sambung_group && formData.level && filteredGenerus.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tidak ada generus aktif ditemukan untuk sambung group "{formData.sambung_group}" level "{formData.level}".
                  </AlertDescription>
                </Alert>
              )}

              {formData.generus_attendance.length > 0 && (
                <div className="space-y-3">
                  {formData.generus_attendance.map((attendance, index) => (
                    <div key={attendance.generus_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">
                          {index + 1}. {attendance.full_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={attendance.status}
                          onValueChange={(value: AttendanceStatus) => 
                            updateAttendanceStatus(attendance.generus_id, value)
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Hadir</SelectItem>
                            <SelectItem value="sick">Sakit</SelectItem>
                            <SelectItem value="permitted">Izin</SelectItem>
                            <SelectItem value="absent">Alpha</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Badge className={getStatusColor(attendance.status)}>
                          {getStatusLabel(attendance.status)}
                        </Badge>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromAttendance(attendance.generus_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !formData.sambung_group || !formData.material || formData.generus_attendance.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Laporan KBM'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}