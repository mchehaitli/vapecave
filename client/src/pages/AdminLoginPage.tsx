import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface LoginFormData {
  username: string;
  password: string;
}

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.isAdmin) {
          toast({
            title: "Login successful",
            description: "Welcome to the Vape Cave Smoke & Stuff admin panel.",
            variant: "default",
          });
          navigate('/admin');
        } else {
          toast({
            title: "Access denied",
            description: "Your account does not have admin privileges.",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Login failed",
          description: errorData.error || "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout
      title="Admin Login | Vape Cave Smoke & Stuff"
      description="Admin login for Vape Cave Smoke & Stuff website management."
    >
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] px-4 py-12 bg-zinc-900">
        <Card className="w-full max-w-md border border-zinc-700 bg-zinc-800 text-white shadow-xl">
          <CardHeader className="space-y-1 border-b border-zinc-700 pb-6">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="bg-zinc-700 border-zinc-600 text-white"
                  {...register("username", { 
                    required: "Username is required" 
                  })}
                />
                {errors.username && (
                  <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-zinc-700 border-zinc-600 text-white"
                  {...register("password", { 
                    required: "Password is required" 
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-700 pt-6">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}