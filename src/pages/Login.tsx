import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, LogIn, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await AuthService.login(email, password);
      if (!user) throw new Error("Role not found");

      toast({
        title: "Login Successful",
        description: `Welcome ${user.name}! Logged in as ${user.role}.`,
      });

      navigate(user.role === "admin" ? "/admin" : "/watchman", {
        replace: true,
      });
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.message || "Invalid credentials",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-700 bg-gray-900/60 backdrop-blur-md">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>

            <CardTitle className="text-2xl font-bold text-white">
              Guest Register
            </CardTitle>

            <CardDescription className="text-gray-300">
              Sign in to access the guest management system
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-smooth focus:ring-2 focus:ring-indigo-600/50 bg-gray-800 text-white border-gray-600"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-smooth focus:ring-2 focus:ring-indigo-600/50 bg-gray-800 text-white border-gray-600 pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-smooth shadow-lg text-white flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
