import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  BarChart3, 
  Users, 
  BookOpen, 
  CreditCard, 
  TestTube, 
  MessageSquare, 
  QrCode,
  Calendar,
  TrendingUp,
  School,
  Clock
} from 'lucide-react';
import { KBMReportForm } from '@/components/teacher/KBMReportForm';
import { ReportSummary } from '@/components/teacher/ReportSummary';
import { GenerusDataManagement } from '@/components/teacher/GenerusDataManagement';
import { MaterialInfo } from '@/components/teacher/MaterialInfo';
import { GenerusIDCard } from '@/components/teacher/GenerusIDCard';
import { TestingModule } from '@/components/teacher/TestingModule';
import { CriticismSuggestions } from '@/components/teacher/CriticismSuggestions';
import { OnlineAttendance } from '@/components/teacher/OnlineAttendance';
import { OnlineAttendanceRecords } from '@/components/teacher/OnlineAttendanceRecords';
import type { Teacher } from '../../../server/src/schema';

interface TeacherDashboardProps {
  user: Teacher;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalReports: 0,
    averageAttendance: 0,
    activeTeachers: 0,
    thisMonthReports: 0
  });

  const menuItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Ringkasan dan statistik keseluruhan'
    },
    {
      id: 'kbm-report',
      label: 'Laporan KBM',
      icon: FileText,
      description: 'Input dan kelola laporan kegiatan belajar mengajar'
    },
    {
      id: 'report-summary',
      label: 'Rekapan Laporan',
      icon: TrendingUp,
      description: 'Lihat ringkasan dan riwayat laporan KBM'
    },
    {
      id: 'generus-data',
      label: 'Data Lengkap Generus',
      icon: Users,
      description: 'Kelola data lengkap para generus'
    },
    {
      id: 'materials',
      label: 'Info Materi',
      icon: BookOpen,
      description: 'Lihat materi yang disediakan koordinator'
    },
    {
      id: 'id-cards',
      label: 'Kartu Identitas Generus',
      icon: CreditCard,
      description: 'Buat dan kelola kartu identitas generus'
    },
    {
      id: 'testing',
      label: 'Pengetesan',
      icon: TestTube,
      description: 'Kelola tes Tilawati, Al-Quran, Hadits, dan Doa Harian'
    },
    {
      id: 'online-attendance',
      label: 'Absensi Online',
      icon: QrCode,
      description: 'Scan barcode generus untuk absensi'
    },
    {
      id: 'attendance-records',
      label: 'Kehadiran Online',
      icon: Clock,
      description: 'Lihat data kehadiran yang telah discan'
    },
    {
      id: 'feedback',
      label: 'Kritik dan Saran',
      icon: MessageSquare,
      description: 'Berikan masukan untuk perbaikan sistem'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              🎓 Selamat Datang, {user.name}!
            </h1>
            <p className="text-blue-100">
              Dashboard Guru Pengajar - Kelola KBM dan Data Generus dengan mudah
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <div className="text-xs text-blue-200">Total Laporan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageAttendance}%</div>
              <div className="text-xs text-blue-200">Rata-rata Kehadiran</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 h-auto p-1">
          {menuItems.slice(0, 5).map((item) => (
            <TabsTrigger 
              key={item.id} 
              value={item.id}
              className="flex flex-col items-center p-3 h-auto data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <item.icon className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Additional menu items for larger screens */}
        <div className="mt-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 h-auto p-1">
            {menuItems.slice(5).map((item) => (
              <TabsTrigger 
                key={item.id} 
                value={item.id}
                className="flex flex-col items-center p-3 h-auto data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <item.icon className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Laporan KBM</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalReports}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rata-rata Kehadiran</p>
                    <p className="text-2xl font-bold text-green-600">{stats.averageAttendance}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Guru Aktif</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.activeTeachers}</p>
                  </div>
                  <School className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Laporan Bulan Ini</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.thisMonthReports}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Aksi Cepat
              </CardTitle>
              <CardDescription>
                Akses fitur yang paling sering digunakan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={() => setActiveTab('kbm-report')}
                  className="flex flex-col items-center p-6 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200"
                  variant="outline"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Buat Laporan KBM</span>
                  <span className="text-xs text-gray-600 mt-1">Input laporan kegiatan baru</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('online-attendance')}
                  className="flex flex-col items-center p-6 h-auto bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200"
                  variant="outline"
                >
                  <QrCode className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Absensi Online</span>
                  <span className="text-xs text-gray-600 mt-1">Scan barcode generus</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('generus-data')}
                  className="flex flex-col items-center p-6 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200"
                  variant="outline"
                >
                  <Users className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Data Generus</span>
                  <span className="text-xs text-gray-600 mt-1">Kelola data lengkap</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('testing')}
                  className="flex flex-col items-center p-6 h-auto bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200"
                  variant="outline"
                >
                  <TestTube className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Pengetesan</span>
                  <span className="text-xs text-gray-600 mt-1">Input hasil tes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kbm-report">
          <KBMReportForm teacherId={user.id} teacherName={user.name} />
        </TabsContent>

        <TabsContent value="report-summary">
          <ReportSummary teacherId={user.id} />
        </TabsContent>

        <TabsContent value="generus-data">
          <GenerusDataManagement />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialInfo />
        </TabsContent>

        <TabsContent value="id-cards">
          <GenerusIDCard />
        </TabsContent>

        <TabsContent value="testing">
          <TestingModule teacherId={user.id} />
        </TabsContent>

        <TabsContent value="online-attendance">
          <OnlineAttendance teacherId={user.id} />
        </TabsContent>

        <TabsContent value="attendance-records">
          <OnlineAttendanceRecords />
        </TabsContent>

        <TabsContent value="feedback">
          <CriticismSuggestions userId={user.id} userType="teacher" userName={user.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}