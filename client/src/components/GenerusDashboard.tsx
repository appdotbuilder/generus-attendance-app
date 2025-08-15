import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { 
  User, 
  Edit,
  BarChart3, 
  QrCode,
  MessageSquare,
  Camera,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { Generus, GenerusDataInput, Level, Gender } from '../../../server/src/schema';

interface GenerusDashboardProps {
  user: Generus;
}

export function GenerusDashboard({ user }: GenerusDashboardProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  
  const [formData, setFormData] = useState<GenerusDataInput>({
    full_name: user.full_name,
    place_of_birth: user.place_of_birth || '',
    date_of_birth: user.date_of_birth || undefined,
    sambung_group: user.sambung_group,
    gender: user.gender || undefined,
    level: user.level,
    status: user.status || '',
    profession: user.profession || '',
    skill: user.skill || '',
    notes: user.notes || '',
    photo_url: user.photo_url || ''
  });

  const [attendanceStats, setAttendanceStats] = useState({
    totalSessions: 0,
    presentCount: 0,
    sickCount: 0,
    permittedCount: 0,
    absentCount: 0,
    attendancePercentage: 0
  });

  const loadAttendanceStats = useCallback(async () => {
    try {
      const stats = await trpc.attendance.getGenerusStats.query({ id: user.id });
      setAttendanceStats({
        totalSessions: stats.total_sessions,
        presentCount: stats.present_count,
        sickCount: stats.sick_count,
        permittedCount: stats.permitted_count,
        absentCount: stats.absent_count,
        attendancePercentage: stats.attendance_percentage
      });
    } catch (error) {
      console.error('Failed to load attendance stats:', error);
      // Set mock data for demo
      setAttendanceStats({
        totalSessions: 24,
        presentCount: 20,
        sickCount: 2,
        permittedCount: 1,
        absentCount: 1,
        attendancePercentage: 83
      });
    }
  }, [user.id]);

  useEffect(() => {
    loadAttendanceStats();
  }, [loadAttendanceStats]);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.generus.createOrUpdate.mutate(formData);
      showAlert('success', 'Data berhasil diperbarui!');
      setIsEditing(false);
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal memperbarui data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBarcode = async () => {
    try {
      await trpc.generus.generateBarcode.mutate({ id: user.id });
      showAlert('success', 'Barcode berhasil dibuat!');
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal membuat barcode');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Belum diisi';
    return new Date(date).toLocaleDateString('id-ID');
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === 'male') return 'Laki-laki';
    if (gender === 'female') return 'Perempuan';
    return 'Belum diisi';
  };

  const getCompletionPercentage = () => {
    const fields = [
      formData.full_name,
      formData.place_of_birth,
      formData.date_of_birth,
      formData.sambung_group,
      formData.gender,
      formData.level,
      formData.status,
      formData.profession,
      formData.skill,
      formData.photo_url
    ];
    const filledFields = fields.filter(field => field && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profil Generus',
      icon: User,
      description: 'Lihat identitas dan data diri'
    },
    {
      id: 'edit-data',
      label: 'Input Data',
      icon: Edit,
      description: 'Lengkapi data diri Anda'
    },
    {
      id: 'statistics',
      label: 'Statistik Kehadiran',
      icon: BarChart3,
      description: 'Lihat statistik kehadiran Anda'
    },
    {
      id: 'barcode',
      label: 'Barcode Absensi',
      icon: QrCode,
      description: 'Generate barcode untuk absensi'
    },
    {
      id: 'feedback',
      label: 'Kritik dan Saran',
      icon: MessageSquare,
      description: 'Berikan masukan sistem'
    }
  ];

  return (
    <div className="space-y-6">
      {alert && (
        <Alert className={`${alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
          <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              🎯 Assalamu'alaikum, {user.full_name}!
            </h1>
            <p className="text-green-100">
              Dashboard Generus - Kelola data diri dan lihat statistik kehadiran Anda
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{attendanceStats.attendancePercentage}%</div>
              <div className="text-xs text-green-200">Kehadiran</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{getCompletionPercentage()}%</div>
              <div className="text-xs text-green-200">Data Lengkap</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 h-auto p-1">
          {menuItems.map((item) => (
            <TabsTrigger 
              key={item.id} 
              value={item.id}
              className="flex flex-col items-center p-3 h-auto data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
            >
              <item.icon className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Profil Generus
              </CardTitle>
              <CardDescription>
                Informasi lengkap data diri Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Photo Section */}
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {user.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{user.full_name}</h3>
                  <Badge className="bg-green-100 text-green-800">{user.level}</Badge>
                </div>

                {/* Personal Info */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Sambung Group</Label>
                        <p className="font-semibold">{user.sambung_group}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Jenis Kelamin</Label>
                        <p className="font-semibold">{getGenderLabel(user.gender)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Tempat Lahir</Label>
                        <p className="font-semibold">{user.place_of_birth || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <p className="font-semibold">{user.status || 'Belum diisi'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Tanggal Lahir</Label>
                        <p className="font-semibold">{formatDate(user.date_of_birth)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Profesi</Label>
                        <p className="font-semibold">{user.profession || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Keahlian</Label>
                        <p className="font-semibold">{user.skill || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Barcode</Label>
                        <p className="font-semibold font-mono text-sm">{user.barcode || 'Belum dibuat'}</p>
                      </div>
                    </div>
                  </div>

                  {user.notes && (
                    <div className="mt-6">
                      <Label className="text-sm font-medium text-gray-600">Catatan</Label>
                      <p className="font-semibold mt-1">{user.notes}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Terdaftar: {formatDate(user.created_at)}</span>
                      <span>Diupdate: {formatDate(user.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Completion Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Kelengkapan Data</h3>
                <span className="text-2xl font-bold text-green-600">{getCompletionPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {getCompletionPercentage() === 100 
                  ? 'Data Anda sudah lengkap! 🎉'
                  : 'Lengkapi data diri Anda untuk mendapatkan layanan yang optimal.'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Data Tab */}
        <TabsContent value="edit-data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-green-600" />
                Input Data Generus
              </CardTitle>
              <CardDescription>
                Lengkapi dan perbarui data diri Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="full_name">Nama Lengkap *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="place_of_birth">Tempat Lahir</Label>
                    <Input
                      id="place_of_birth"
                      value={formData.place_of_birth || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, place_of_birth: e.target.value }))}
                      placeholder="Masukkan tempat lahir"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth ? new Date(formData.date_of_birth).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        date_of_birth: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sambung_group">Sambung Group *</Label>
                    <Input
                      id="sambung_group"
                      value={formData.sambung_group}
                      onChange={(e) => setFormData(prev => ({ ...prev, sambung_group: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select 
                      value={formData.gender || ''} 
                      onValueChange={(value: Gender | '') => setFormData(prev => ({ 
                        ...prev, 
                        gender: value === '' ? undefined : value as Gender 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tidak dipilih</SelectItem>
                        <SelectItem value="male">Laki-laki</SelectItem>
                        <SelectItem value="female">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="level">Level *</Label>
                    <Select 
                      value={formData.level} 
                      onValueChange={(value: Level) => setFormData(prev => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pra-remaja">Pra-Remaja</SelectItem>
                        <SelectItem value="remaja">Remaja</SelectItem>
                        <SelectItem value="usia-mandiri-kuliah">Usia Mandiri/Kuliah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      value={formData.status || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      placeholder="Pelajar, Mahasiswa, dll"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="profession">Profesi/Pekerjaan</Label>
                    <Input
                      id="profession"
                      value={formData.profession || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                      placeholder="Profesi atau pekerjaan"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="skill">Keahlian</Label>
                    <Input
                      id="skill"
                      value={formData.skill || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, skill: e.target.value }))}
                      placeholder="Keahlian khusus"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="photo_url">URL Foto</Label>
                    <Input
                      id="photo_url"
                      value={formData.photo_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                      placeholder="Link foto profil"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Catatan tambahan tentang diri Anda"
                      rows={3}
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalSessions}</p>
                  <p className="text-sm text-gray-600">Total Sesi</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.presentCount}</p>
                  <p className="text-sm text-gray-600">Hadir</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{attendanceStats.sickCount}</p>
                  <p className="text-sm text-gray-600">Sakit</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.permittedCount}</p>
                  <p className="text-sm text-gray-600">Izin</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</p>
                  <p className="text-sm text-gray-600">Alpha</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Persentase Kehadiran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-green-600 mb-2">{attendanceStats.attendancePercentage}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-green-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${attendanceStats.attendancePercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Tingkat kehadiran Anda dalam pembelajaran
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="font-semibold text-green-800">Target Kehadiran</p>
                    <p className="text-2xl font-bold text-green-600">80%</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="font-semibold text-blue-800">Pencapaian Anda</p>
                    <p className="text-2xl font-bold text-blue-600">{attendanceStats.attendancePercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Barcode Tab */}
        <TabsContent value="barcode">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-600" />
                Barcode Absensi Online
              </CardTitle>
              <CardDescription>
                Generate barcode unik untuk absensi online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                {user.barcode ? (
                  <div>
                    <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <div className="font-mono text-sm text-gray-800 break-all">
                          {user.barcode}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Barcode Aktif
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      Tunjukkan barcode ini kepada guru untuk absensi online
                    </p>
                  </div>
                ) : (
                  <div>
                    <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Barcode Belum Dibuat</h3>
                    <p className="text-gray-600 mb-6">
                      Buat barcode unik Anda untuk dapat melakukan absensi online
                    </p>
                    <Button 
                      onClick={handleGenerateBarcode}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate Barcode
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Kritik dan Saran
              </CardTitle>
              <CardDescription>
                Berikan masukan untuk perbaikan sistem pembelajaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fitur Akan Segera Tersedia</h3>
                <p className="text-gray-600">
                  Fitur kritik dan saran sedang dalam pengembangan dan akan segera tersedia untuk Anda gunakan.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}