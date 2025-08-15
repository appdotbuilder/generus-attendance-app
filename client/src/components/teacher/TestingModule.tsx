import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestTube, BookOpen, Clock, Award, BarChart3 } from 'lucide-react';

interface TestingModuleProps {
  teacherId: number;
}

export function TestingModule({ teacherId }: TestingModuleProps) {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const testModules = [
    {
      id: 'tilawati',
      title: 'Pengetesan Tilawati',
      description: 'Tes kemampuan membaca Al-Quran dengan metode Tilawati',
      icon: BookOpen,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      id: 'alquran',
      title: 'Pengetesan Al-Quran',
      description: 'Tes hafalan dan pemahaman Al-Quran',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'hadits',
      title: 'Pengetesan Al-Hadits',
      description: 'Tes hafalan dan pemahaman hadits-hadits pilihan',
      icon: BookOpen,
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      id: 'prayers',
      title: 'Pengetesan Doa Harian',
      description: 'Tes hafalan doa-doa harian dan bacaan shalat',
      icon: Clock,
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    {
      id: 'all-results',
      title: 'Semua Hasil Tes',
      description: 'Lihat dan kelola semua hasil pengetesan',
      icon: BarChart3,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-blue-600" />
            Modul Pengetesan
          </CardTitle>
          <CardDescription>
            Kelola berbagai jenis pengetesan untuk generus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testModules.map((module) => (
              <Card key={module.id} className="card-hover cursor-pointer" onClick={() => setActiveTest(module.id)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <module.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                      <Badge className={module.color}>
                        {module.id === 'all-results' ? 'Lihat Hasil' : 'Input Nilai'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for specific test module */}
      {activeTest && (
        <Card>
          <CardHeader>
            <CardTitle>
              {testModules.find(m => m.id === activeTest)?.title}
            </CardTitle>
            <CardDescription>
              Fitur pengetesan akan segera tersedia dalam versi selanjutnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dalam Pengembangan</h3>
              <p className="text-gray-600 mb-4">
                Modul pengetesan sedang dalam tahap pengembangan dan akan segera tersedia.
              </p>
              <Button onClick={() => setActiveTest(null)}>
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}