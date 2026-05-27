import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";

import { AdminLayout } from "@/components/layout/admin-layout";
import { MainLayout } from "@/components/layout/main-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { ResidentLayout } from "@/components/layout/resident-layout";
import { RedirectIfAuthenticated, RequireAdmin, RequireResident } from "@/features/auth";
import { AdminApplicationsPage } from "@/pages/admin-applications-page";
import { AdminDashboardPage } from "@/pages/admin-dashboard-page";
import { AdminResidentsPage } from "@/pages/admin-residents-page";
import { AnnouncementsPage } from "@/pages/announcements-page";
import { ContactPage } from "@/pages/contact-page";
import { FaqPage } from "@/pages/faq-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { PrivacyPolicyPage } from "@/pages/privacy-policy-page";
import { ProfilePage } from "@/pages/profile-page";
import { RegisterPage } from "@/pages/register-page";
import { ReportsPage } from "@/pages/reports-page";
import { RequirementsPage } from "@/pages/requirements-page";
import { ResidentApplicationPage } from "@/pages/resident-application-page";
import { ResidentDashboardPage } from "@/pages/resident-dashboard-page";
import { ResidentUploadsPage } from "@/pages/resident-uploads-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { ServiceDetailsPage } from "@/pages/service-details-page";
import { SettingsPage } from "@/pages/settings-page";
import { ServicesPage } from "@/pages/services-page";
import { UnauthorizedPage } from "@/pages/unauthorized-page";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/services", element: <ServicesPage /> },
          { path: "/services/:serviceSlug", element: <ServiceDetailsPage /> },
          { path: "/requirements", element: <RequirementsPage /> },
          { path: "/announcements", element: <AnnouncementsPage /> },
          { path: "/faq", element: <FaqPage /> },
          { path: "/contact", element: <ContactPage /> },
          { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
          {
            path: "/request-assistance",
            element: <Navigate to="/resident/application?request=1" replace />,
          },
          {
            path: "/unauthorized",
            element: <UnauthorizedPage />,
          },
          {
            element: <RedirectIfAuthenticated />,
            children: [
              { path: "/login", element: <LoginPage /> },
              { path: "/register", element: <RegisterPage /> },
              { path: "/forgot-password", element: <ForgotPasswordPage /> },
            ],
          },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ],
      },
      {
        path: "/admin",
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              {
                path: "applications",
                element: <AdminApplicationsPage />,
              },
              {
                path: "residents",
                element: <AdminResidentsPage />,
              },
              {
                path: "reports",
                element: <ReportsPage />,
              },
              {
                path: "settings",
                element: <SettingsPage />,
              },
            ],
          },
        ],
      },
      {
        path: "/resident",
        element: <RequireResident />,
        children: [
          {
            element: <ResidentLayout />,
            children: [
              { index: true, element: <ResidentDashboardPage /> },
              {
                path: "application",
                element: <ResidentApplicationPage />,
              },
              {
                path: "uploads",
                element: <ResidentUploadsPage />,
              },
              {
                path: "profile",
                element: <ProfilePage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
