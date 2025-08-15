import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { QrCode, Camera, CameraOff, RotateCcw, CheckCircle2, AlertCircle, User } from 'lucide-react';
import type { OnlineAttendance as OnlineAttendanceType } from '../../../../server/src/schema';

interface OnlineAttendanceProps {
  teacherId: number;
}

export function OnlineAttendance({ teacherId }: OnlineAttendanceProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResults, setScannedResults] = useState<Array<{
    barcode: string;
    generusName: string;
    timestamp: Date;
    success: boolean;
  }>>([]);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
      showAlert('success', 'Kamera berhasil diaktifkan. Scan barcode generus!');
    } catch (error) {
      showAlert('error', 'Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const handleScanResult = async (barcode: string) => {
    try {
      const attendanceData: OnlineAttendanceType = {
        generusBarcode: barcode,
        teacherId: teacherId
      };

      await trpc.attendance.recordOnline.mutate(attendanceData);
      
      // Simulate getting generus name (in real implementation, this would come from the API response)
      const generusName = `Generus-${barcode.slice(-4)}`;
      
      setScannedResults(prev => [{
        barcode,
        generusName,
        timestamp: new Date(),
        success: true
      }, ...prev.slice(0, 9)]); // Keep only last 10 results

      showAlert('success', `Kehadiran ${generusName} berhasil dicatat!`);
    } catch (error: any) {
      setScannedResults(prev => [{
        barcode,
        generusName: 'Tidak dikenal',
        timestamp: new Date(),
        success: false
      }, ...prev.slice(0, 9)]);
      
      showAlert('error', error.message || 'Gagal mencatat kehadiran');
    }
  };

  const handleManualInput = async () => {
    if (!manualBarcode.trim()) {
      showAlert('error', 'Masukkan barcode terlebih dahulu');
      return;
    }

    await handleScanResult(manualBarcode.trim());
    setManualBarcode('');
  };

  // Simulate barcode detection (in real implementation, use a QR/barcode library)
  const simulateScan = () => {
    const mockBarcode = `GEN${Date.now().toString().slice(-6)}`;
    handleScanResult(mockBarcode);
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              Scanner Barcode
            </CardTitle>
            <CardDescription>
              Scan barcode generus untuk mencatat kehadiran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {isScanning ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Scan Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center bg-black/20">
                        <div className="text-center text-white">
                          <QrCode className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Arahkan barcode ke area ini</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400 mb-4">Kamera tidak aktif</p>
                      <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Aktifkan Kamera
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-2">
                {isScanning ? (
                  <>
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      <CameraOff className="w-4 h-4 mr-2" />
                      Matikan Kamera
                    </Button>
                    <Button onClick={simulateScan} className="flex-1 bg-green-600 hover:bg-green-700">
                      Simulasi Scan
                    </Button>
                  </>
                ) : (
                  <Button onClick={startCamera} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Camera className="w-4 h-4 mr-2" />
                    Mulai Scan
                  </Button>
                )}
              </div>

              {/* Manual Input */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Input Manual Barcode</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Masukkan barcode..."
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={handleManualInput}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Hasil Scan
                </CardTitle>
                <CardDescription>
                  Riwayat scan barcode hari ini
                </CardDescription>
              </div>
              <Button
                onClick={() => setScannedResults([])}
                variant="outline"
                size="sm"
                disabled={scannedResults.length === 0}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scannedResults.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Belum ada scan</p>
                <p className="text-sm text-gray-500 mt-1">
                  Hasil scan barcode akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scannedResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        result.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${
                          result.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {result.generusName}
                        </p>
                        <p className="text-xs text-gray-600">
                          Barcode: {result.barcode}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {result.success ? 'Berhasil' : 'Gagal'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.timestamp.toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">📱 Cara Menggunakan Absensi Online</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Aktifkan kamera untuk mulai scanning barcode generus</li>
                <li>• Arahkan barcode generus ke area scan yang ditandai</li>
                <li>• Tunggu hingga barcode terbaca dan kehadiran tercatat otomatis</li>
                <li>• Gunakan input manual jika barcode sulit terbaca kamera</li>
                <li>• Pastikan barcode generus sudah dibuat terlebih dahulu</li>
                <li>• Kehadiran akan langsung tersimpan ke sistem</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}