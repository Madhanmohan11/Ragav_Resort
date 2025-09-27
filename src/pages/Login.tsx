import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const user = AuthService.login(email, password);
      
      if (user) {
        toast({
          title: "Login Successful",
          description: `Welcome ${user.name}! Logged in as ${user.role}.`,
        });

        navigate(user.role === "admin" ? "/admin" : "/watchman");
      } else {
        toast({
          title: "Login Failed",
          description: "Please use demo credentials: admin@demo.com or watchman@demo.com",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-700 bg-gray-900/60 backdrop-blur-md">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Guest Register</CardTitle>
            <CardDescription className="text-gray-300">
              Sign in to access the guest management system
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter any password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-smooth focus:ring-2 focus:ring-indigo-600/50 bg-gray-800 text-white border-gray-600"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-smooth shadow-lg text-white flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : <><LogIn className="w-4 h-4" /> Sign In</>}
              </Button>
            </form>

            {/* <div className="space-y-2 text-center text-sm text-gray-400 border-t border-gray-700 pt-4">
              <p><strong>Demo Credentials:</strong></p>
              <p>Admin: admin@demo.com</p>
              <p>Watchman: watchman@demo.com</p>
              <p><em>Use any password</em></p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
