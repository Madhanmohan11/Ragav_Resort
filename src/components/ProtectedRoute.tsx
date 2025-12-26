import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthService } from "@/lib/auth";

interface Props {
  children: JSX.Element;
  requiredRole?: "admin" | "watchman";
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const [checking, setChecking] = useState(true);
  const [userValid, setUserValid] = useState(false);

  useEffect(() => {
    const user = AuthService.getCurrentUser();

    if (!user) {
      setUserValid(false);
      setChecking(false);
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      setUserValid(false);
      setChecking(false);
      return;
    }

    setUserValid(true);
    setChecking(false);
  }, [requiredRole]);   // 👈 IMPORTANT — ONLY THIS

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Checking permissions...
      </div>
    );
  }

  if (!userValid) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
