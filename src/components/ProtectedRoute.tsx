import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'watchman';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = AuthService.getCurrentUser();

    if (!user) {
      navigate('/');
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      navigate(user.role === 'admin' ? '/admin' : '/watchman');
      return;
    }

    setChecking(false);
  }, [navigate, requiredRole]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Checking permissions...
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
