import { useState, useEffect } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { CoordinatorDashboard } from '@/components/CoordinatorDashboard';
import { GenerusDashboard } from '@/components/GenerusDashboard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import type { Teacher, Coordinator, Generus, UserType } from '../../server/src/schema';

export interface UserSession {
  userType: UserType;
  user: Teacher | Coordinator | Generus;
  isAuthenticated: boolean;
}

function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const savedSession = localStorage.getItem('generus-app-session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        localStorage.removeItem('generus-app-session');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
    localStorage.setItem('generus-app-session', JSON.stringify(userSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('generus-app-session');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-touska-light flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-4 border-blue-touska-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-touska-secondary">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header session={session} onLogout={handleLogout} />
      
      <main className="min-h-[calc(100vh-140px)] py-6">
        {!session?.isAuthenticated ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <div className="container mx-auto px-4">
            {session.userType === 'teacher' && (
              <TeacherDashboard user={session.user as Teacher} />
            )}
            {session.userType === 'coordinator' && (
              <CoordinatorDashboard user={session.user as Coordinator} />
            )}
            {session.userType === 'generus' && (
              <GenerusDashboard user={session.user as Generus} />
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;