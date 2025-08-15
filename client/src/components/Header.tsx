import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Clock } from 'lucide-react';
import type { UserSession } from '@/App';

interface HeaderProps {
  session: UserSession | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeZone, setTimeZone] = useState<'WIB' | 'WITA' | 'WIT'>('WIB');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Detect timezone based on browser
    const detectTimeZone = () => {
      const offset = -new Date().getTimezoneOffset() / 60;
      if (offset === 7) return 'WIB';
      if (offset === 8) return 'WITA';
      if (offset === 9) return 'WIT';
      return 'WIB'; // Default
    };

    setTimeZone(detectTimeZone());

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserName = () => {
    if (!session?.user) return '';
    
    if ('name' in session.user) {
      return session.user.name;
    }
    if ('full_name' in session.user) {
      return session.user.full_name;
    }
    return '';
  };

  const getUserTypeLabel = () => {
    switch (session?.userType) {
      case 'teacher':
        return 'Guru Pengajar';
      case 'coordinator':
        return 'Koordinator';
      case 'generus':
        return 'Generus';
      default:
        return '';
    }
  };

  return (
    <header className="header-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        {/* Main title and clock row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="text-center lg:text-left">
            <h1 className="text-xl lg:text-2xl font-bold mb-2">
              📚 Aplikasi Kehadiran Generus - Generasi Penerus Jama'ah
            </h1>
            <p className="text-sm lg:text-base text-blue-100">
              Desa Situbondo Barat (de Sind'rat) - Tahun 2025
            </p>
          </div>
          
          <div className="flex flex-col items-center lg:items-end text-center lg:text-right">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5" />
              <span className="digital-clock text-lg lg:text-xl">
                {formatTime(currentTime)} {timeZone}
              </span>
            </div>
            <p className="text-xs lg:text-sm text-blue-100">
              {formatDate(currentTime)}
            </p>
          </div>
        </div>

        {/* User info and logout row */}
        {session?.isAuthenticated && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-blue-400/30">
            <div className="text-center sm:text-left">
              <p className="text-sm text-blue-100">
                Selamat datang, {getUserTypeLabel()}
              </p>
              <p className="font-semibold text-lg">
                {getUserName()}
              </p>
            </div>
            
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-fit mx-auto sm:mx-0"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}