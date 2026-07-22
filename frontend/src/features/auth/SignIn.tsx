import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useAuth } from "./AuthProvider";

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { configError, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as { from?: { pathname?: string } } | null;
  const returnTo = state?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (session) {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo, session]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const result = await signIn(email, password);

    setIsSubmitting(false);
    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    navigate(returnTo, { replace: true });
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

            {(configError || errorMessage) && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {configError || errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-500">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
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
                  onClick={(event) => event.preventDefault()}
                  className="text-sm hover:underline"
                  style={{ color: "#FF6B35" }}
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || Boolean(configError)}
                className="w-full text-white hover:opacity-90 transition-opacity mt-6 rounded-lg"
                style={{ backgroundColor: "#FF6B35" }}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>

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
