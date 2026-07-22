import { Navigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type AppRole, useAuth } from "./AuthProvider";

type ProtectedRouteProps = {
  allowedRoles?: AppRole[];
  children: React.ReactNode;
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const location = useLocation();
  const { configError, loading, role, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Alert variant="destructive" className="max-w-lg bg-white">
          <AlertTitle>Authentication is not configured</AlertTitle>
          <AlertDescription>{configError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Alert variant="destructive" className="max-w-lg bg-white">
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription>
            Your account does not have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
}
