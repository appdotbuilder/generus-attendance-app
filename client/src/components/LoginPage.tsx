import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { UserCircle2, GraduationCap, Shield, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { UserSession } from '@/App';
import type { 
  TeacherLogin, 
  TeacherRegistration, 
  GenerusLogin, 
  CoordinatorLogin,
  Level 
} from '../../../server/src/schema';

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState('generus');
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerusModal, setShowGenerusModal] = useState(false);
  const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);
  const [showTeacherRegister, setShowTeacherRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Form states
  const [teacherLogin, setTeacherLogin] = useState<TeacherLogin>({
    email: '',
    password: '',
    remember_me: false
  });

  const [teacherRegister, setTeacherRegister] = useState<TeacherRegistration>({
    name: '',
    email: '',
    username: '',
    password: ''
  });

  const [generusLogin, setGenerusLogin] = useState<GenerusLogin>({
    full_name: '',
    level: 'pra-remaja',
    sambung_group: ''
  });

  const [coordinatorLogin, setCoordinatorLogin] = useState<CoordinatorLogin>({
    name: '',
    access_code: ''
  });

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleTeacherLogin = async () => {
    setIsLoading(true);
    try {
      const response = await trpc.auth.loginTeacher.mutate(teacherLogin);
      if (response.success && response.teacher) {
        onLogin({
          userType: 'teacher',
          user: response.teacher,
          isAuthenticated: true
        });
        showAlert('success', response.message || 'Login berhasil! Selamat datang, Guru Pengajar.');
      } else {
        showAlert('error', response.message || 'Login gagal. Silakan periksa email dan password Anda.');
      }
    } catch (error: any) {
      showAlert('error', error.message || 'Login gagal. Silakan periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherRegister = async () => {
    setIsLoading(true);
    try {
      const response = await trpc.auth.registerTeacher.mutate(teacherRegister);
      if (response.success) {
        showAlert('success', response.message || 'Registrasi berhasil! Silakan login dengan akun yang baru dibuat.');
        setShowTeacherRegister(false);
        setTeacherRegister({ name: '', email: '', username: '', password: '' });
      } else {
        showAlert('error', response.message || 'Registrasi gagal. Silakan coba lagi.');
      }
    } catch (error: any) {
      showAlert('error', error.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerusLogin = async () => {
    setIsLoading(true);
    try {
      const response = await trpc.auth.loginGenerus.mutate(generusLogin);
      if (response.success && response.generus) {
        onLogin({
          userType: 'generus',
          user: response.generus,
          isAuthenticated: true
        });
        setShowGenerusModal(false);
        showAlert('success', response.message || 'Login berhasil! Selamat datang di Dashboard Generus.');
      } else {
        showAlert('error', response.message || 'Login gagal. Silakan periksa data yang dimasukkan.');
      }
    } catch (error: any) {
      showAlert('error', error.message || 'Login gagal. Silakan periksa data yang dimasukkan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoordinatorLogin = async () => {
    setIsLoading(true);
    try {
      const response = await trpc.auth.loginCoordinator.mutate(coordinatorLogin);
      if (response.success && response.coordinator) {
        onLogin({
          userType: 'coordinator',
          user: response.coordinator,
          isAuthenticated: true
        });
        setShowCoordinatorModal(false);
        showAlert('success', response.message || 'Login berhasil! Selamat datang di Dashboard Koordinator.');
      } else {
        showAlert('error', response.message || 'Login gagal. Silakan periksa nama dan kode akses.');
      }
    } catch (error: any) {
      showAlert('error', error.message || 'Login gagal. Silakan periksa nama dan kode akses.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        {alert && (
          <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {alert.type === 'error' ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
            <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-blue-touska">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-touska-primary">
              🔐 Masuk ke Sistem
            </CardTitle>
            <CardDescription>
              Pilih jenis pengguna untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="generus" className="text-xs sm:text-sm">
                  <UserCircle2 className="w-4 h-4 mr-1" />
                  Generus
                </TabsTrigger>
                <TabsTrigger value="teacher" className="text-xs sm:text-sm">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Guru
                </TabsTrigger>
                <TabsTrigger value="coordinator" className="text-xs sm:text-sm">
                  <Shield className="w-4 h-4 mr-1" />
                  Koordinator
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generus" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-touska-light rounded-full flex items-center justify-center">
                    <UserCircle2 className="w-8 h-8 text-blue-touska-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-touska-secondary">Dashboard Generus</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Akses profil, input data, dan lihat statistik kehadiran Anda
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowGenerusModal(true)}
                    className="w-full bg-blue-touska-primary hover:bg-blue-touska-secondary"
                  >
                    Masuk sebagai Generus
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="teacher" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-touska-light rounded-full flex items-center justify-center mb-4">
                      <GraduationCap className="w-8 h-8 text-blue-touska-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-touska-secondary">Dashboard Guru Pengajar</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Kelola KBM, absensi, dan data generus
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={teacherLogin.email}
                        onChange={(e) => setTeacherLogin(prev => ({ ...prev, email: e.target.value }))}
                        className="border-blue-touska/30 focus:border-blue-touska"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Masukkan password"
                          value={teacherLogin.password}
                          onChange={(e) => setTeacherLogin(prev => ({ ...prev, password: e.target.value }))}
                          className="border-blue-touska/30 focus:border-blue-touska pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-9 w-9 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember"
                        checked={teacherLogin.remember_me}
                        onCheckedChange={(checked) => setTeacherLogin(prev => ({ ...prev, remember_me: !!checked }))}
                      />
                      <Label htmlFor="remember" className="text-sm">Ingat saya</Label>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleTeacherLogin}
                    disabled={isLoading || !teacherLogin.email || !teacherLogin.password}
                    className="w-full bg-blue-touska-primary hover:bg-blue-touska-secondary"
                  >
                    {isLoading ? 'Memproses...' : 'Masuk'}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowTeacherRegister(true)}
                      className="text-blue-touska-primary hover:text-blue-touska-secondary"
                    >
                      Belum punya akun? Daftar di sini
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="coordinator" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-touska-light rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-blue-touska-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-touska-secondary">Dashboard Koordinator</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Kelola guru, materi, dan laporan keseluruhan
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowCoordinatorModal(true)}
                    className="w-full bg-blue-touska-primary hover:bg-blue-touska-secondary"
                  >
                    Masuk sebagai Koordinator
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Generus Login Modal */}
        <Dialog open={showGenerusModal} onOpenChange={setShowGenerusModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Login Generus</DialogTitle>
              <DialogDescription>
                Masukkan data diri Anda untuk mengakses dashboard generus
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  placeholder="Masukkan nama lengkap"
                  value={generusLogin.full_name}
                  onChange={(e) => setGenerusLogin(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Select value={generusLogin.level} onValueChange={(value: Level) => setGenerusLogin(prev => ({ ...prev, level: value }))}>
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
              <div>
                <Label htmlFor="sambung_group">Sambung Group</Label>
                <Input
                  id="sambung_group"
                  placeholder="Masukkan sambung group"
                  value={generusLogin.sambung_group}
                  onChange={(e) => setGenerusLogin(prev => ({ ...prev, sambung_group: e.target.value }))}
                />
              </div>
              <Button 
                onClick={handleGenerusLogin}
                disabled={isLoading || !generusLogin.full_name || !generusLogin.sambung_group}
                className="w-full"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Coordinator Login Modal */}
        <Dialog open={showCoordinatorModal} onOpenChange={setShowCoordinatorModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Login Koordinator</DialogTitle>
              <DialogDescription>
                Masukkan nama koordinator dan kode akses
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="coord_name">Nama Koordinator</Label>
                <Input
                  id="coord_name"
                  placeholder="Masukkan nama koordinator"
                  value={coordinatorLogin.name}
                  onChange={(e) => setCoordinatorLogin(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="access_code">Kode Akses</Label>
                <Input
                  id="access_code"
                  type="password"
                  placeholder="Masukkan kode akses"
                  value={coordinatorLogin.access_code}
                  onChange={(e) => setCoordinatorLogin(prev => ({ ...prev, access_code: e.target.value }))}
                />
              </div>
              <Button 
                onClick={handleCoordinatorLogin}
                disabled={isLoading || !coordinatorLogin.name || !coordinatorLogin.access_code}
                className="w-full"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Teacher Registration Modal */}
        <Dialog open={showTeacherRegister} onOpenChange={setShowTeacherRegister}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrasi Guru Pengajar</DialogTitle>
              <DialogDescription>
                Daftarkan akun baru untuk guru pengajar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reg_name">Nama Lengkap</Label>
                <Input
                  id="reg_name"
                  placeholder="Masukkan nama lengkap"
                  value={teacherRegister.name}
                  onChange={(e) => setTeacherRegister(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="reg_email">Email</Label>
                <Input
                  id="reg_email"
                  type="email"
                  placeholder="email@example.com"
                  value={teacherRegister.email}
                  onChange={(e) => setTeacherRegister(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="reg_username">Username</Label>
                <Input
                  id="reg_username"
                  placeholder="Masukkan username"
                  value={teacherRegister.username}
                  onChange={(e) => setTeacherRegister(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="reg_password">Password</Label>
                <Input
                  id="reg_password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={teacherRegister.password}
                  onChange={(e) => setTeacherRegister(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <Button 
                onClick={handleTeacherRegister}
                disabled={isLoading || !teacherRegister.name || !teacherRegister.email || !teacherRegister.username || teacherRegister.password.length < 6}
                className="w-full"
              >
                {isLoading ? 'Mendaftar...' : 'Daftar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}