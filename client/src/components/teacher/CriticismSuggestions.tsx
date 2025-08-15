import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UserType, CreateCriticismSuggestion } from '../../../../server/src/schema';

interface CriticismSuggestionsProps {
  userId: number;
  userType: UserType;
  userName: string;
}

export function CriticismSuggestions({ userId, userType, userName }: CriticismSuggestionsProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const showAlert = (type: 'error' | 'success', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      showAlert('error', 'Pesan tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    try {
      const data: CreateCriticismSuggestion = {
        user_type: userType,
        user_id: userId,
        user_name: userName,
        message: message.trim()
      };

      await trpc.criticismSuggestions.create.mutate(data);
      showAlert('success', 'Kritik dan saran berhasil dikirim!');
      setMessage('');
    } catch (error: any) {
      showAlert('error', error.message || 'Gagal mengirim kritik dan saran');
    } finally {
      setIsLoading(false);
    }
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Kritik dan Saran
          </CardTitle>
          <CardDescription>
            Berikan masukan untuk perbaikan sistem pembelajaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="message">Pesan Anda</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan kritik, saran, atau masukan Anda untuk perbaikan sistem..."
                rows={6}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Pesan Anda akan dikirim kepada koordinator untuk ditindaklanjuti.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !message.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Pesan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Guidelines Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">💬 Panduan Kritik dan Saran</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Sampaikan kritik dan saran dengan bahasa yang sopan dan konstruktif</li>
                <li>• Jelaskan masalah atau usulan perbaikan dengan detail yang cukup</li>
                <li>• Berikan contoh konkret jika memungkinkan</li>
                <li>• Koordinator akan menindaklanjuti masukan yang diberikan</li>
                <li>• Identitas Anda akan dijaga kerahasiaannya</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}