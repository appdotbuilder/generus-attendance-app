import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  BarChart3, 
  BookOpen, 
  CreditCard, 
  TestTube, 
  MessageSquare,
  Clock,
  GraduationCap,
  FileText,
  Award,
  TrendingUp
} from 'lucide-react';
import type { Coordinator } from '../../../server/src/schema';

interface CoordinatorDashboardProps {
  user: Coordinator;
}

export function CoordinatorDashboard({ user }: CoordinatorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Ringkasan dan statistik keseluruhan'
    },
    {
      id: 'teachers',
      label: 'Daftar Guru Pengajar',
      icon: GraduationCap,
      description: 'Kelola guru pengajar dan akses login'
    },
    {
      id: 'reports',
      label: 'Rekapan Laporan',
      icon: TrendingUp,
      description: 'Lihat ringkasan laporan KBM dari semua guru'
    },
    {
      id: 'generus-data',
      label: 'Data Lengkap Generus',
      icon: Users,
      description: 'Kelola data lengkap generus (edit & delete)'
    },
    {
      id: 'materials',
      label: 'Info Materi',
      icon: BookOpen,
      description: 'Tambah dan kelola materi pembelajaran'
    },
    {
      id: 'id-cards',
      label: 'Kartu Identitas Generus',
      icon: CreditCard,
      description: 'Generate ID card untuk generus'
    },
    {
      id: 'testing',
      label: 'Pengetesan',
      icon: TestTube,
      description: 'Kelola hasil pengetesan dari guru'
    },
    {
      id: 'feedback',
      label: 'Kritik dan Saran',
      icon: MessageSquare,
      description: 'Lihat masukan dari guru dan generus'
    },
    {
      id: 'report-cards',
      label: 'Raport',
      icon: Award,
      description: 'Generate raport generus (dalam pengembangan)'
    },
    {
      id: 'attendance-records',
      label: 'Kehadiran Online',
      icon: Clock,
      description: 'Lihat semua data kehadiran online'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              👑 Selamat Datang, {user.name}!
            </h1>
            <p className="text-purple-100">
              Dashboard Koordinator - Kelola keseluruhan sistem pembelajaran dan guru pengajar
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">15</div>
              <div className="text-xs text-purple-200">Guru Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">245</div>
              <div className="text-xs text-purple-200">Total Generus</div>
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
              className="flex flex-col items-center p-3 h-auto data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              <item.icon className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Additional menu items */}
        <div className="mt-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 h-auto p-1">
            {menuItems.slice(5).map((item) => (
              <TabsTrigger 
                key={item.id} 
                value={item.id}
                className="flex flex-col items-center p-3 h-auto data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
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
                    <p className="text-sm text-gray-600 mb-1">Total Guru</p>
                    <p className="text-2xl font-bold text-purple-600">15</p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Generus</p>
                    <p className="text-2xl font-bold text-blue-600">245</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Materi</p>
                    <p className="text-2xl font-bold text-green-600">28</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Laporan Bulan Ini</p>
                    <p className="text-2xl font-bold text-orange-600">87</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Aksi Koordinator
              </CardTitle>
              <CardDescription>
                Akses cepat untuk tugas koordinator utama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={() => setActiveTab('teachers')}
                  className="flex flex-col items-center p-6 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200"
                  variant="outline"
                >
                  <GraduationCap className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Kelola Guru</span>
                  <span className="text-xs text-gray-600 mt-1">Daftar guru pengajar</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('materials')}
                  className="flex flex-col items-center p-6 h-auto bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200"
                  variant="outline"
                >
                  <BookOpen className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Tambah Materi</span>
                  <span className="text-xs text-gray-600 mt-1">Upload pembelajaran</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('generus-data')}
                  className="flex flex-col items-center p-6 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200"
                  variant="outline"
                >
                  <Users className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Data Generus</span>
                  <span className="text-xs text-gray-600 mt-1">Edit & kelola data</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('feedback')}
                  className="flex flex-col items-center p-6 h-auto bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200"
                  variant="outline"
                >
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Lihat Masukan</span>
                  <span className="text-xs text-gray-600 mt-1">Kritik dan saran</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents - placeholder for now */}
        {menuItems.slice(1).map((item) => (
          <TabsContent key={item.id} value={item.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <item.icon className="w-5 h-5 text-purple-600" />
                  {item.label}
                </CardTitle>
                <CardDescription>
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <item.icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dalam Pengembangan</h3>
                  <p className="text-gray-600 mb-4">
                    Fitur {item.label.toLowerCase()} sedang dalam tahap pengembangan dan akan segera tersedia.
                  </p>
                  <p className="text-sm text-gray-500">
                    Terima kasih atas kesabaran Anda.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}