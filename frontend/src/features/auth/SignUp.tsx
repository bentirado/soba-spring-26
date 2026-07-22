import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export function SignUp() {
  const navigate = useNavigate();
  const { configError, session, signUp } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, session]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email, password, {
      firstName,
      lastName,
      phone,
    });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccessMessage("Account created. Check your email to confirm your account before signing in.");
      return;
    }

    navigate("/dashboard", { replace: true });
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
          <h1 className="text-3xl font-bold mb-2">
            Science Museum of Oklahoma
          </h1>
          <p className="text-lg opacity-90">Analytics Dashboard</p>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4">Join Our Team!</h2>
          <p className="text-lg opacity-90 max-w-md">
            Create your account to manage volunteers and gain insights. Empower
            your team with powerful analytics and scheduling tools.
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-1 w-12 bg-white opacity-50" />
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center p-4 lg:p-8"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <Card className="w-full max-w-[440px] shadow-lg overflow-hidden rounded-xl">
          <CardHeader className="space-y-3 pb-4 pt-12 px-6 bg-white">
            <div>
              <CardTitle
                className="text-2xl mb-1"
                style={{ color: "#1e5eb8" }}
              >
                Create Account
              </CardTitle>
              <CardDescription className="text-sm">
                Sign up as a volunteer coordinator
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

            {successMessage && (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" style={{ color: "#2C3E5D" }}>
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                    className="focus-visible:ring-2 border-gray-300"
                    style={
                      {
                        "--tw-ring-color": "#FF6B35",
                      } as React.CSSProperties
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" style={{ color: "#2C3E5D" }}>
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                    className="focus-visible:ring-2 border-gray-300"
                    style={
                      {
                        "--tw-ring-color": "#FF6B35",
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: "#2C3E5D" }}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="focus-visible:ring-2 border-gray-300"
                  style={
                    {
                      "--tw-ring-color": "#FF6B35",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" style={{ color: "#2C3E5D" }}>
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  className="focus-visible:ring-2 border-gray-300"
                  style={
                    {
                      "--tw-ring-color": "#FF6B35",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: "#2C3E5D" }}>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="focus-visible:ring-2 border-gray-300"
                  style={
                    {
                      "--tw-ring-color": "#FF6B35",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" style={{ color: "#2C3E5D" }}>
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="focus-visible:ring-2 border-gray-300"
                  style={
                    {
                      "--tw-ring-color": "#FF6B35",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 rounded"
                  style={{ accentColor: "#FF6B35" }}
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the terms and conditions and privacy policy
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || Boolean(configError)}
                className="w-full text-white hover:opacity-90 transition-opacity mt-6"
                style={{ backgroundColor: "#FF6B35" }}
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm border-t pt-4 border-gray-200">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                to="/signin"
                className="hover:underline font-medium"
                style={{ color: "#FF6B35" }}
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
