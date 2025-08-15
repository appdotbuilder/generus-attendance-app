import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  TrendingUp, 
  Download,
  Eye,
  FileText,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { KBMReport, DashboardStats, MonthlyAttendance } from '../../../../server/src/schema';

interface ReportSummaryProps {
  teacherId: number;
}

export function ReportSummary({ teacherId }: ReportSummaryProps) {
  const [reports, setReports] = useState<KBMReport[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendance[]>([]);
  const [selectedReport, setSelectedReport] = useState<KBMReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [reportsData, statsData, monthlyAttendanceData] = await Promise.all([
        trpc.kbmReports.getByTeacher.query({ id: teacherId }),
        trpc.dashboard.getStats.query(),
        trpc.dashboard.getMonthlyAttendance.query()
      ]);

      setReports(reportsData);
      setStats(statsData);
      setMonthlyData(monthlyAttendanceData);
    } catch (error: any) {
      console.error('Failed to load report summary:', error);
      showAlert('error', 'Gagal memuat data ringkasan laporan');
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleExportExcel = async () => {
    try {
      const result = await trpc.kbmReports.exportToExcel.query({ teacherId });
      showAlert('success', 'Data berhasil diekspor ke Excel!');
      // Note: In a real implementation, this would trigger a file download
      console.log('Export result:', result);
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal mengekspor data ke Excel');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir':
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sakit':
      case 'sick':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'izin':
      case 'permitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'alpha':
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data ringkasan...</p>
        </div>
      </div>
    );
  }

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover dashboard-item">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Laporan</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.total_reports || 0}</p>
                <p className="text-xs text-green-600 mt-1">↗ {reports.length} laporan Anda</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover dashboard-item">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rata-rata Kehadiran</p>
                <p className="text-3xl font-bold text-green-600">{stats?.average_attendance || 0}%</p>
                <p className="text-xs text-gray-600 mt-1">Keseluruhan sistem</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover dashboard-item">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Guru Aktif</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.active_teachers || 0}</p>
                <p className="text-xs text-gray-600 mt-1">Total guru terdaftar</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover dashboard-item">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bulan Ini</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.this_month_reports || 0}</p>
                <p className="text-xs text-gray-600 mt-1">Laporan bulan ini</p>
              </div>
              <Calendar className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Attendance Chart Placeholder */}
      <Card className="dashboard-item">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Grafik Kehadiran Bulanan
          </CardTitle>
          <CardDescription>
            Data kehadiran generus dan guru per bulan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">Grafik Kehadiran</p>
              <p className="text-sm text-gray-600">Data untuk {monthlyData.length} bulan terakhir</p>
              {monthlyData.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(monthlyData.reduce((acc, curr) => acc + curr.generus_attendance, 0) / monthlyData.length)}%
                    </div>
                    <div className="text-gray-600">Rata-rata Generus</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(monthlyData.reduce((acc, curr) => acc + curr.teacher_attendance, 0) / monthlyData.length)}%
                    </div>
                    <div className="text-gray-600">Rata-rata Guru</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{monthlyData.length}</div>
                    <div className="text-gray-600">Bulan Data</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports History */}
      <Card className="dashboard-item">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Riwayat Laporan KBM
              </CardTitle>
              <CardDescription>
                Daftar laporan KBM yang telah dibuat
              </CardDescription>
            </div>
            <Button 
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Belum ada laporan KBM</p>
              <p className="text-sm text-gray-500 mt-1">
                Laporan yang Anda buat akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 10).map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {formatDate(report.day_date)}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {report.sambung_group}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {report.level}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Materi: {report.material}</p>
                      {report.notes && <p className="mt-1 text-gray-500">Catatan: {report.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        Dibuat: {new Date(report.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detail Laporan KBM</DialogTitle>
                          <DialogDescription>
                            {formatDate(selectedReport?.day_date || new Date())}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedReport && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Guru Pengajar</Label>
                                <p className="font-semibold">{selectedReport.teacher_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Sambung Group</Label>
                                <p className="font-semibold">{selectedReport.sambung_group}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Level</Label>
                                <p className="font-semibold">{selectedReport.level}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Tanggal</Label>
                                <p className="font-semibold">{formatDate(selectedReport.day_date)}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Materi</Label>
                              <p className="font-semibold">{selectedReport.material}</p>
                            </div>
                            
                            {selectedReport.notes && (
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Catatan</Label>
                                <p className="font-semibold">{selectedReport.notes}</p>
                              </div>
                            )}

                            <div>
                              <Label className="text-sm font-medium text-gray-600 mb-2 block">
                                Daftar Kehadiran
                              </Label>
                              <div className="text-center py-4 bg-gray-50 rounded-lg">
                                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                  Data kehadiran tersedia di detail laporan lengkap
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
              
              {reports.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Menampilkan 10 dari {reports.length} laporan
                  </p>
                  <Button variant="link" className="text-blue-600">
                    Lihat semua laporan
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Simple Label component for consistency
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label 
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  );
}