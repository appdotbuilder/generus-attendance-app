import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { 
  BookOpen, 
  Download,
  ExternalLink,
  FileText,
  Link,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { MaterialInfo } from '../../../../server/src/schema';

export function MaterialInfo() {
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const loadMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.materials.getAll.query();
      setMaterials(data);
    } catch (error: any) {
      console.error('Failed to load materials:', error);
      showAlert('error', 'Gagal memuat data materi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleDownload = async (materialId: number, title: string) => {
    try {
      await trpc.materials.download.query({ id: materialId });
      showAlert('success', `Mengunduh materi "${title}"`);
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal mengunduh materi');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat materi pembelajaran...</p>
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
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Info Materi Pembelajaran
          </CardTitle>
          <CardDescription>
            Materi pembelajaran yang disediakan oleh koordinator - Total: {materials.length} materi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Materi</h3>
              <p className="text-gray-600 mb-4">
                Koordinator belum menambahkan materi pembelajaran.
              </p>
              <p className="text-sm text-gray-500">
                Materi yang ditambahkan koordinator akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <Card key={material.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            {material.file_url ? (
                              <FileText className="w-6 h-6 text-blue-600" />
                            ) : material.link_url ? (
                              <Link className="w-6 h-6 text-blue-600" />
                            ) : (
                              <BookOpen className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 line-clamp-2">
                              {material.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {material.file_url ? 'File' : material.link_url ? 'Link' : 'Teks'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {material.description && (
                        <div>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {material.description}
                          </p>
                        </div>
                      )}

                      {/* Content Preview */}
                      {material.content && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700 line-clamp-4">
                            {material.content}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {material.file_url && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleDownload(material.id, material.title)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                        
                        {material.link_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(material.link_url!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Buka Link
                          </Button>
                        )}
                        
                        {!material.file_url && !material.link_url && material.content && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              // Show full content in a modal or expand view
                              showAlert('success', 'Fitur lihat detail akan segera tersedia');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detail
                          </Button>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(material.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Koordinator
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips Menggunakan Materi</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Download materi sebelum mengajar untuk persiapan yang optimal</li>
                <li>• Gunakan link eksternal untuk materi interaktif atau video</li>
                <li>• Simpan materi di perangkat untuk akses offline</li>
                <li>• Hubungi koordinator jika ada materi yang perlu ditambahkan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add missing Eye icon import or define it locally
function Eye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}