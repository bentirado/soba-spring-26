import { Link, useNavigate } from "react-router-dom";
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

export function SignIn() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e5eb8 0%, #0d3a7a 50%, #1e5eb8 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-lg opacity-90 max-w-md">
            Access your volunteer analytics and insights. Track your impact and
            manage your schedule seamlessly.
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-1 w-12 bg-white opacity-50 mb-6" />
          <h1 className="text-xl font-semibold mb-1">
            Science Museum of Oklahoma
          </h1>
          <p className="text-sm opacity-80">Analytics Dashboard</p>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center p-4 lg:p-8"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <Card className="w-full max-w-[380px] shadow-lg overflow-hidden rounded-xl">
          <CardHeader className="space-y-3 pb-4 pt-12 px-6 bg-white">
            <div>
              <CardTitle
                className="text-2xl mb-2 font-semibold"
                style={{ color: "#1e5eb8" }}
              >
                Login to your account
              </CardTitle>
              <CardDescription className="text-sm">
                Welcome back! Enter your details to log in to your account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2 px-6 pb-6 bg-white">
            <div className="h-px bg-gray-200 mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-500">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="focus-visible:ring-2 border-gray-300 placeholder:font-semibold rounded-lg"
                  style={
                    {
                      "--tw-ring-color": "#FF6B35",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-500">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="focus-visible:ring-2 border-gray-300 placeholder:font-semibold rounded-lg"
                  style={
                    {
                      "--tw-ring-color": "#FF6B35",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-2 border-gray-300 bg-white w-4 h-4"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>

                <a
                  href="#"
                  className="text-sm hover:underline"
                  style={{ color: "#FF6B35" }}
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full text-white hover:opacity-90 transition-opacity mt-6 rounded-lg"
                style={{ backgroundColor: "#FF6B35" }}
              >
                Login
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="mt-6 text-center text-sm border-t pt-4 border-gray-200">
              <span className="text-gray-600">Don't have an account? </span>
              <Link
                to="/signup"
                className="hover:underline font-medium"
                style={{ color: "#FF6B35" }}
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}