import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { 
  Users, 
  Plus, 
  Search,
  Filter,
  Upload,
  Eye,
  Edit,
  UserCheck,
  UserX,
  Camera,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { Generus, GenerusDataInput, Level, Gender } from '../../../../server/src/schema';

export function GenerusDataManagement() {
  const [generusList, setGenerusList] = useState<Generus[]>([]);
  const [filteredGenerus, setFilteredGenerus] = useState<Generus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<Level | 'all'>('all');
  const [filterGroup, setFilterGroup] = useState<string | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedGenerus, setSelectedGenerus] = useState<Generus | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [formData, setFormData] = useState<GenerusDataInput>({
    full_name: '',
    place_of_birth: '',
    date_of_birth: undefined,
    sambung_group: '',
    gender: undefined,
    level: 'pra-remaja',
    status: '',
    profession: '',
    skill: '',
    notes: '',
    photo_url: ''
  });

  const loadGenerus = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.generus.getAll.query();
      setGenerusList(data);
      setFilteredGenerus(data);
    } catch (error: any) {
      console.error('Failed to load generus:', error);
      showAlert('error', 'Gagal memuat data generus');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGenerus();
  }, [loadGenerus]);

  // Filter and search logic
  useEffect(() => {
    let filtered = generusList;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.sambung_group.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.place_of_birth && g.place_of_birth.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(g => g.level === filterLevel);
    }

    // Group filter
    if (filterGroup !== 'all') {
      filtered = filtered.filter(g => g.sambung_group === filterGroup);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(g => 
        filterStatus === 'active' ? g.is_active : !g.is_active
      );
    }

    setFilteredGenerus(filtered);
  }, [generusList, searchTerm, filterLevel, filterGroup, filterStatus]);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleAddGenerus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.generus.createOrUpdate.mutate(formData);
      showAlert('success', 'Data generus berhasil ditambahkan!');
      await loadGenerus();
      setShowAddForm(false);
      resetForm();
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal menambahkan data generus');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      place_of_birth: '',
      date_of_birth: undefined,
      sambung_group: '',
      gender: undefined,
      level: 'pra-remaja',
      status: '',
      profession: '',
      skill: '',
      notes: '',
      photo_url: ''
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Tidak diisi';
    return new Date(date).toLocaleDateString('id-ID');
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <UserCheck className="w-3 h-3 mr-1" />
        Aktif
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <UserX className="w-3 h-3 mr-1" />
        Tidak Aktif
      </Badge>
    );
  };

  // Get unique values for filters
  const uniqueGroups = [...new Set(generusList.map(g => g.sambung_group))].sort();

  if (isLoading && generusList.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data generus...</p>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Data Lengkap Generus
              </CardTitle>
              <CardDescription>
                Kelola data lengkap para generus - Total: {filteredGenerus.length} dari {generusList.length}
              </CardDescription>
            </div>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Generus
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Data Generus</DialogTitle>
                  <DialogDescription>
                    Input data lengkap generus baru
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddGenerus} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="full_name">Nama Lengkap *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="place_of_birth">Tempat Lahir</Label>
                      <Input
                        id="place_of_birth"
                        value={formData.place_of_birth || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, place_of_birth: e.target.value || '' }))}
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
                        placeholder="Masukkan sambung group"
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
                      <Label htmlFor="status">Status</Label>
                      <Input
                        id="status"
                        value={formData.status || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value || '' }))}
                        placeholder="Status (pelajar, mahasiswa, dll)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="profession">Profesi/Pekerjaan</Label>
                      <Input
                        id="profession"
                        value={formData.profession || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value || '' }))}
                        placeholder="Profesi atau pekerjaan"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="skill">Keahlian</Label>
                      <Input
                        id="skill"
                        value={formData.skill || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, skill: e.target.value || '' }))}
                        placeholder="Keahlian khusus"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="photo_url">URL Foto</Label>
                      <Input
                        id="photo_url"
                        value={formData.photo_url || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value || '' }))}
                        placeholder="Link foto (opsional)"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="notes">Catatan</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value || '' }))}
                        placeholder="Catatan tambahan"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari berdasarkan nama, group, atau tempat lahir..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import Data
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={filterLevel} onValueChange={(value: Level | 'all') => setFilterLevel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Level</SelectItem>
                  <SelectItem value="pra-remaja">Pra-Remaja</SelectItem>
                  <SelectItem value="remaja">Remaja</SelectItem>
                  <SelectItem value="usia-mandiri-kuliah">Usia Mandiri/Kuliah</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterGroup} onValueChange={(value: string | 'all') => setFilterGroup(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Group</SelectItem>
                  {uniqueGroups.map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generus List */}
          {filteredGenerus.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {searchTerm || filterLevel !== 'all' || filterGroup !== 'all' || filterStatus !== 'all' 
                  ? 'Tidak ada generus yang sesuai dengan filter' 
                  : 'Belum ada data generus'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || filterLevel !== 'all' || filterGroup !== 'all' || filterStatus !== 'all'
                  ? 'Coba ubah kriteria pencarian atau filter'
                  : 'Tambahkan data generus untuk mulai mengelola'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGenerus.map((generus) => (
                <Card key={generus.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {generus.photo_url ? (
                            <img 
                              src={generus.photo_url} 
                              alt={generus.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{generus.full_name}</h4>
                          <p className="text-sm text-gray-600">{generus.sambung_group}</p>
                        </div>
                      </div>
                      {getStatusBadge(generus.is_active)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Level:</span>
                        <Badge variant="outline">{generus.level}</Badge>
                      </div>
                      {generus.place_of_birth && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tempat Lahir:</span>
                          <span>{generus.place_of_birth}</span>
                        </div>
                      )}
                      {generus.date_of_birth && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tanggal Lahir:</span>
                          <span>{formatDate(generus.date_of_birth)}</span>
                        </div>
                      )}
                      {generus.profession && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Profesi:</span>
                          <span>{generus.profession}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedGenerus(generus)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detail
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detail Generus</DialogTitle>
                            <DialogDescription>
                              Informasi lengkap {selectedGenerus?.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedGenerus && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Nama Lengkap</Label>
                                  <p className="font-semibold">{selectedGenerus.full_name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Sambung Group</Label>
                                  <p className="font-semibold">{selectedGenerus.sambung_group}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Level</Label>
                                  <p className="font-semibold">{selectedGenerus.level}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                                  {getStatusBadge(selectedGenerus.is_active)}
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Jenis Kelamin</Label>
                                  <p className="font-semibold">
                                    {selectedGenerus.gender === 'male' ? 'Laki-laki' : 
                                     selectedGenerus.gender === 'female' ? 'Perempuan' : 'Tidak diisi'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Tempat Lahir</Label>
                                  <p className="font-semibold">{selectedGenerus.place_of_birth || 'Tidak diisi'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Tanggal Lahir</Label>
                                  <p className="font-semibold">{formatDate(selectedGenerus.date_of_birth)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Profesi</Label>
                                  <p className="font-semibold">{selectedGenerus.profession || 'Tidak diisi'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Keahlian</Label>
                                  <p className="font-semibold">{selectedGenerus.skill || 'Tidak diisi'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Barcode</Label>
                                  <p className="font-semibold">{selectedGenerus.barcode || 'Belum dibuat'}</p>
                                </div>
                              </div>
                              
                              {selectedGenerus.notes && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Catatan</Label>
                                  <p className="font-semibold">{selectedGenerus.notes}</p>
                                </div>
                              )}
                              
                              <div className="flex justify-between text-sm text-gray-500 pt-4 border-t">
                                <span>Dibuat: {new Date(selectedGenerus.created_at).toLocaleString('id-ID')}</span>
                                <span>Diupdate: {new Date(selectedGenerus.updated_at).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}