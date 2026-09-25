import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { CenteredSpinner } from "@/components/ui";
import { ContactsPage } from "./pages/ContactsPage";

const OwnerLayout = lazy(() =>
  import("@/components/layout/OwnerLayout").then((m) => ({
    default: m.OwnerLayout,
  })),
);

const OverviewPage = lazy(() =>
  import("@/pages/owner/OverviewPage").then((m) => ({ default: m.OverviewPage })),
);
const CarsPage = lazy(() =>
  import("@/pages/owner/CarsPage").then((m) => ({ default: m.CarsPage })),
);
const RentalsPage = lazy(() =>
  import("@/pages/owner/RentalsPage").then((m) => ({ default: m.RentalsPage })),
);
const ClientsPage = lazy(() =>
  import("@/pages/owner/ClientsPage").then((m) => ({ default: m.ClientsPage })),
);
const StorefrontPage = lazy(() =>
  import("@/pages/owner/StorefrontPage").then((m) => ({ default: m.StorefrontPage })),
);
const FinancePage = lazy(() =>
  import("@/pages/owner/FinancePage").then((m) => ({ default: m.FinancePage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/owner/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const CustomerLoginPage = lazy(() =>
  import("@/pages/auth/CustomerLoginPage").then((m) => ({
    default: m.CustomerLoginPage,
  })),
);

const CustomerWelcomePage = lazy(() =>
  import("@/pages/market/CustomerWelcomePage").then((m) => ({
    default: m.CustomerWelcomePage,
  })),
);

const MarketplacePage = lazy(() =>
  import("@/pages/market/MarketplacePage").then((m) => ({
    default: m.MarketplacePage,
  })),
);
const AccountPage = lazy(() =>
  import("@/pages/market/AccountPage").then((m) => ({
    default: m.AccountPage,
  })),
);

const PrivacyPage = lazy(() =>
  import("@/pages/legal/PrivacyPage").then((m) => ({ default: m.PrivacyPage })),
);
const TermsPage = lazy(() =>
  import("@/pages/legal/TermsPage").then((m) => ({ default: m.TermsPage })),
);

const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

const wrap = (el: ReactNode) => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center">
        <CenteredSpinner label="Загружаем…" />
      </div>
    }
  >
    {el}
  </Suspense>
);

const CarDetailPage = lazy(() =>
  import("@/pages/market/CarDetailPage").then((m) => ({ default: m.CarDetailPage })),
);

const FleetPage = lazy(() =>
  import("@/pages/market/FleetPage").then((m) => ({ default: m.FleetPage })),
);

const PricingPage = lazy(() =>
  import("@/pages/PricingPage").then((m) => ({ default: m.PricingPage })),
);

const BookingDetailPage = lazy(() =>
  import("@/pages/market/BookingDetailPage").then((m) => ({
    default: m.BookingDetailPage,
  })),
);

const WelcomePage = lazy(() =>
  import("@/pages/owner/WelcomePage").then((m) => ({ default: m.WelcomePage })),
);

export const router = createBrowserRouter([
  // Marketplace
  { path: "/", element: wrap(<MarketplacePage />) },
  { path: "/login", element: wrap(<CustomerLoginPage />) },
  { path: "/account", element: wrap(<AccountPage />) },
  { path: "/account/bookings/:id", element: wrap(<BookingDetailPage />) },
  { path: "/car/:id", element: wrap(<CarDetailPage />) },
  { path: "/fleet/:slug", element: wrap(<FleetPage />) },
  { path: "/account/welcome", element: wrap(<CustomerWelcomePage />) },

  // Owner auth
  { path: "/app/login", element: wrap(<LoginPage />) },
  { path: "/app/register", element: wrap(<RegisterPage />) },
  { path: "/app/welcome", element: wrap(<WelcomePage />) },

  //Legal
  { path: "/privacy", element: wrap(<PrivacyPage />) },
  { path: "/terms", element: wrap(<TermsPage />) },
  { path: "/pricing", element: wrap(<PricingPage />) },
  { path: "/contacts", element: wrap(<ContactsPage />) },
  // Owner app — обёрнуто в OwnerLayout
  {
    path: "/app",
    element: wrap(<OwnerLayout />),
    children: [
      { index: true, element: wrap(<OverviewPage />) },
      { path: "cars", element: wrap(<CarsPage />) },
      { path: "rentals", element: wrap(<RentalsPage />) },
      { path: "clients", element: wrap(<ClientsPage />) },
      { path: "storefront", element: wrap(<StorefrontPage />) },
      { path: "finance", element: wrap(<FinancePage />) },
      { path: "settings", element: wrap(<SettingsPage />) },
      { path: "*", element: <Navigate to="/app" replace /> },
    ],
  },

  // 404
  { path: "*", element: wrap(<NotFoundPage />) },
]);