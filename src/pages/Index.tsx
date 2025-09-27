import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";
import { AuthService } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/watchman");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700 rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          Guest Register
          <span className="block text-indigo-400">Management System</span>
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Streamline your facility's guest management with our professional, secure, and easy-to-use system.
        </p>
        <Button
          onClick={() => navigate("/login")}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-smooth shadow-lg text-lg px-8 py-4 flex items-center justify-center gap-2 w-full text-white"
        >
          Login to System
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
