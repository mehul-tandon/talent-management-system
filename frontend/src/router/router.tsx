import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedLayout } from "../layouts/protected-layout";
import { useAuth } from "../features/auth/auth-context";

const LoginPage = lazy(async () => import("../features/auth/login-page").then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(async () => import("../features/dashboard/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const EmployeesPage = lazy(async () => import("../features/employees/employees-page").then((module) => ({ default: module.EmployeesPage })));
const RecruitmentPage = lazy(async () => import("../features/recruitment/recruitment-page").then((module) => ({ default: module.RecruitmentPage })));
const PerformancePage = lazy(async () => import("../features/performance/performance-page").then((module) => ({ default: module.PerformancePage })));
const AnalyticsPage = lazy(async () => import("../features/analytics/analytics-page").then((module) => ({ default: module.AnalyticsPage })));

function RouteLoader() {
  return <div className="panel">Loading workspace...</div>;
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

function LoginRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <RouteLoader />;
  }

  return isAuthenticated ? <Navigate replace to="/" /> : withSuspense(<LoginPage />);
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginRoute />
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<DashboardPage />)
      },
      {
        path: "employees",
        element: withSuspense(<EmployeesPage />)
      },
      {
        path: "recruitment",
        element: withSuspense(<RecruitmentPage />)
      },
      {
        path: "performance",
        element: withSuspense(<PerformancePage />)
      },
      {
        path: "analytics",
        element: withSuspense(<AnalyticsPage />)
      }
    ]
  }
]);
