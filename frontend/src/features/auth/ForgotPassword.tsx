import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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

export function ForgotPassword() {
  const { configError, resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const result = await resetPasswordForEmail(email);

    setIsSubmitting(false);
    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage("If an account exists for that email, password reset instructions have been sent.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4">
      <Card className="w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
        <CardHeader className="space-y-3 px-6 pb-4 pt-10">
          <div>
            <CardTitle className="mb-2 text-2xl font-semibold" style={{ color: "#1e5eb8" }}>
              Reset your password
            </CardTitle>
            <CardDescription className="text-sm">
              Enter your dashboard email and we will send password reset instructions.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2">
          <div className="mb-6 h-px bg-gray-200" />

          {(configError || errorMessage) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{configError || errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-gray-500">
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="rounded-lg border-gray-300 placeholder:font-semibold focus-visible:ring-2"
                style={
                  {
                    "--tw-ring-color": "#FF6B35",
                  } as React.CSSProperties
                }
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || Boolean(configError)}
              className="mt-6 w-full rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FF6B35" }}
            >
              {isSubmitting ? "Sending..." : "Send reset email"}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm">
            <Link to="/signin" className="font-medium hover:underline" style={{ color: "#FF6B35" }}>
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
