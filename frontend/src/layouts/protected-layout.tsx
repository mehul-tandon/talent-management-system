import { Navigate } from "react-router-dom";
import { AppShell } from "../components/app-shell";
import { useAuth } from "../features/auth/auth-context";

export function ProtectedLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <main className="page-grid page-shell-loader">Loading workspace...</main>;
  }

  return isAuthenticated ? <AppShell /> : <Navigate replace to="/login" />;
}
