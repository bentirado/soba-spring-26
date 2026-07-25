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

export function ResetPassword() {
  const navigate = useNavigate();
  const { configError, session, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setErrorMessage("");
  }, [session]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage("Password updated. Redirecting to login...");
    window.setTimeout(() => {
      navigate("/signin", { replace: true });
    }, 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4">
      <Card className="w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
        <CardHeader className="space-y-3 px-6 pb-4 pt-10">
          <div>
            <CardTitle className="mb-2 text-2xl font-semibold" style={{ color: "#1e5eb8" }}>
              Choose a new password
            </CardTitle>
            <CardDescription className="text-sm">
              Enter a new password for your dashboard account.
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

          {!session && !successMessage && (
            <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
              <AlertDescription>
                Open this page from the password reset email before choosing a new password.
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-500">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="rounded-lg border-gray-300 placeholder:font-semibold focus-visible:ring-2"
                style={
                  {
                    "--tw-ring-color": "#FF6B35",
                  } as React.CSSProperties
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-gray-500">
                Confirm password
              </Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
              disabled={isSubmitting || Boolean(configError) || !session}
              className="mt-6 w-full rounded-lg text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
              style={isSubmitting || Boolean(configError) || !session ? undefined : { backgroundColor: "#FF6B35" }}
            >
              {isSubmitting ? "Updating..." : "Update password"}
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
