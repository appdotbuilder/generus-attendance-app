import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { 
  CreditCard, 
  User,
  Download,
  Search,
  QrCode,
  Image,
  AlertCircle,
  CheckCircle2,
  FileImage
} from 'lucide-react';
import type { Generus } from '../../../../server/src/schema';

export function GenerusIDCard() {
  const [generusList, setGenerusList] = useState<Generus[]>([]);
  const [selectedGenerus, setSelectedGenerus] = useState<Generus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGenerus, setFilteredGenerus] = useState<Generus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const loadGenerus = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.generus.getAll.query();
      const activeGenerus = data.filter(g => g.is_active);
      setGenerusList(activeGenerus);
      setFilteredGenerus(activeGenerus);
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

  // Filter generus based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = generusList.filter(g => 
        g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.sambung_group.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGenerus(filtered);
    } else {
      setFilteredGenerus(generusList);
    }
  }, [searchTerm, generusList]);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleGenerateIDCard = async (generusId: number) => {
    setIsGenerating(true);
    try {
      await trpc.idCards.generate.mutate({ id: generusId });
      showAlert('success', 'ID Card berhasil dibuat!');
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal membuat ID Card');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePDF = async (generusId: number) => {
    setIsGenerating(true);
    try {
      await trpc.idCards.generatePDF.mutate({ id: generusId });
      showAlert('success', 'PDF ID Card berhasil dibuat!');
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal membuat PDF ID Card');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Tidak diisi';
    return new Date(date).toLocaleDateString('id-ID');
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === 'male') return 'Laki-laki';
    if (gender === 'female') return 'Perempuan';
    return 'Tidak diisi';
  };

  if (isLoading) {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generus Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Pilih Generus
            </CardTitle>
            <CardDescription>
              Pilih generus untuk membuat ID Card
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Cari Generus</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Cari nama atau group..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredGenerus.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      {searchTerm ? 'Generus tidak ditemukan' : 'Tidak ada generus aktif'}
                    </p>
                  </div>
                ) : (
                  filteredGenerus.map((generus) => (
                    <div
                      key={generus.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGenerus?.id === generus.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedGenerus(generus)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {generus.photo_url ? (
                            <img
                              src={generus.photo_url}
                              alt={generus.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{generus.full_name}</p>
                          <p className="text-xs text-gray-600">{generus.sambung_group}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ID Card Preview Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Preview ID Card Generus
            </CardTitle>
            <CardDescription>
              Preview dan generate ID Card dalam format KTP
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedGenerus ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilih Generus</h3>
                <p className="text-gray-600">
                  Pilih generus dari panel kiri untuk melihat preview ID Card
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ID Card Preview */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-xl text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">KARTU IDENTITAS GENERUS</h3>
                      <p className="text-blue-200 text-sm">Generasi Penerus Jama'ah - Desa Situbondo Barat</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                      <QrCode className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Photo Section */}
                    <div className="flex justify-center">
                      <div className="w-24 h-32 bg-white/20 rounded-lg flex items-center justify-center">
                        {selectedGenerus.photo_url ? (
                          <img
                            src={selectedGenerus.photo_url}
                            alt={selectedGenerus.full_name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Image className="w-8 h-8 mx-auto mb-2 text-white/60" />
                            <p className="text-xs text-white/60">Foto</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide">Nama Lengkap</p>
                          <p className="font-semibold">{selectedGenerus.full_name}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide">Sambung Group</p>
                          <p className="font-semibold">{selectedGenerus.sambung_group}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide">Level</p>
                          <p className="font-semibold">{selectedGenerus.level}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide">Jenis Kelamin</p>
                          <p className="font-semibold">{getGenderLabel(selectedGenerus.gender)}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide">Tempat Lahir</p>
                          <p className="font-semibold">{selectedGenerus.place_of_birth || 'Tidak diisi'}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide">Tanggal Lahir</p>
                          <p className="font-semibold">{formatDate(selectedGenerus.date_of_birth)}</p>
                        </div>
                      </div>
                      
                      {selectedGenerus.barcode && (
                        <div className="pt-2 border-t border-white/20">
                          <p className="text-blue-200 text-xs uppercase tracking-wide">Barcode</p>
                          <p className="font-mono text-sm">{selectedGenerus.barcode}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-blue-200">ID: {selectedGenerus.id.toString().padStart(6, '0')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-200">Tahun 2025</p>
                      <p className="text-xs text-blue-200">PJP de Sind'rat</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleGenerateIDCard(selectedGenerus.id)}
                    disabled={isGenerating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                      <FileImage className="w-4 h-4 mr-2" />
                    )}
                    Generate ID Card
                  </Button>
                  
                  <Button
                    onClick={() => handleGeneratePDF(selectedGenerus.id)}
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <div className="spinner w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Informasi Tambahan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedGenerus.profession && (
                      <div>
                        <span className="text-gray-600">Profesi: </span>
                        <span className="font-medium">{selectedGenerus.profession}</span>
                      </div>
                    )}
                    {selectedGenerus.skill && (
                      <div>
                        <span className="text-gray-600">Keahlian: </span>
                        <span className="font-medium">{selectedGenerus.skill}</span>
                      </div>
                    )}
                    {selectedGenerus.status && (
                      <div>
                        <span className="text-gray-600">Status: </span>
                        <span className="font-medium">{selectedGenerus.status}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Terdaftar: </span>
                      <span className="font-medium">{formatDate(selectedGenerus.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}