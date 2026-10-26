import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { NAV, COMMAND_CENTRE, Role, canAccessModule, findModuleByPath, roleHomePath } from "@bsc/shared";
import { useAuthStore } from "./store/auth";
import { AppShell } from "./components/layout/AppShell";
import { useActiveFeature } from "./hooks/useActiveFeature";
import { FeatureWorkspace } from "./features/FeatureWorkspace";
import { ModuleHub, RECORD_PAGES } from "./features/ModuleHub";
import { Login } from "./pages/Login";
import { CommandCentre } from "./pages/CommandCentre";
import { ZonesPage } from "./pages/zones/ZonesPage";
import { FacilitiesPage } from "./pages/facilities/FacilitiesPage";
import { BookingsPage } from "./pages/bookings/BookingsPage";
import { MembershipPage } from "./pages/membership/MembershipPage";
import { GatesPage } from "./pages/gates/GatesPage";
import { VisitorsPage } from "./pages/visitors/VisitorsPage";
import { VipPage } from "./pages/vip/VipPage";
import { LoungesPage } from "./pages/lounges/LoungesPage";
import { OutletsPage } from "./pages/outlets/OutletsPage";
import { ParkingPage } from "./pages/parking/ParkingPage";
import { FleetPage } from "./pages/fleet/FleetPage";
import { SurfacesPage } from "./pages/surfaces/SurfacesPage";
import { CalendarPage } from "./pages/operations/CalendarPage";
import { TasksPage } from "./pages/operations/TasksPage";
import { ApprovalsPage } from "./pages/operations/ApprovalsPage";
import { NoAccess } from "./pages/NoAccess";
import { TicketsHome, EventsListPage } from "./pages/tickets/TicketsHome";
import { EventPage } from "./pages/tickets/EventPage";
import { CheckoutPage } from "./pages/tickets/CheckoutPage";
import { HelpPage, MyBookingsPage, OrderPage } from "./pages/tickets/OrderPages";
import { TicketingEventsPage, TicketingOrdersPage, TicketingOverview, TicketingPaymentsPage, TicketingReportsPage } from "./pages/ticketing/TicketingOps";
import { GateScanPage } from "./pages/ticketing/GateScanPage";
import { SpecModulePage } from "./pages/platform/SpecModulePage";
import { isRegistryFeature } from "./pages/platform/ResourceFeature";
import { SecurityRegisters } from "./pages/security/SecurityRegisters";
import { DashFrame } from "./pages/dashboards/DashFrame";
import { DashSettings } from "./pages/dashboards/DashSettings";
import { RevenueDashboard } from "./pages/dashboards/RevenueDashboard";
import { HrDashboard } from "./pages/dashboards/HrDashboard";
import { BookingDashboard } from "./pages/dashboards/BookingDashboard";
import { SecurityDashboard } from "./pages/dashboards/SecurityDashboard";
import { ChairmanDashboard } from "./pages/dashboards/ChairmanDashboard";
import { SuperAdminDashboard } from "./pages/dashboards/SuperAdminDashboard";
import { ReadOnlyContext } from "./pages/dashboards/widgets";

const DASH_ROLES = new Set<string>([Role.BOOKINGS_OFFICER, Role.FINANCE_CONTROLLER, Role.HR_MANAGER, Role.SECURITY_MANAGER, Role.CHAIRMAN, Role.SUPER_ADMIN]);

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

const MODULE_TITLES: Record<string, string> = {
  [COMMAND_CENTRE.path]: COMMAND_CENTRE.label,
};
for (const group of NAV) {
  for (const mod of group.modules) {
    MODULE_TITLES[mod.path] = mod.label;
  }
}

/** Built module pages, keyed by nav path. Anything not listed here falls back to the Phase-N placeholder. */
const MODULE_PAGES: Record<string, () => JSX.Element> = {
  "/zones": ZonesPage,
  "/facilities": FacilitiesPage,
  "/bookings": BookingsPage,
  "/membership": MembershipPage,
  "/gates": GatesPage,
  "/visitors": VisitorsPage,
  "/vip": VipPage,
  "/lounges": LoungesPage,
  "/outlets": OutletsPage,
  "/parking": ParkingPage,
  "/fleet": FleetPage,
  "/surfaces": SurfacesPage,
  "/calendar": CalendarPage,
  "/tasks": TasksPage,
  "/approvals": ApprovalsPage,
  "/ticketing": TicketingOverview,
  "/ticketing/events": TicketingEventsPage,
  "/ticketing/orders": TicketingOrdersPage,
  "/ticketing/payments": TicketingPaymentsPage,
  "/ticketing/scan": GateScanPage,
  "/ticketing/reports": TicketingReportsPage,
  "/finance": SpecModulePage,
  "/procurement": SpecModulePage,
  "/hrm": SpecModulePage,
};

/** Sends a role to its home page; a role that cannot open its own home sees NoAccess instead of looping. */
function GoHome({ from }: { from: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const home = roleHomePath(role);
  return home === from ? <NoAccess /> : <Navigate to={home} replace />;
}

function RequireModule({ path, children }: { path: string; children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  if (path === "/security") {
    if (role === Role.SECURITY_MANAGER || role === Role.SUPER_ADMIN || role === Role.CHAIRMAN) return <>{children}</>;
    return <GoHome from={path} />;
  }
  if (path === "/" && canAccessModule(role, "command-centre")) return <>{children}</>;
  if (path === "/") return <GoHome from={path} />;
  const module = findModuleByPath(path);
  if (module && !canAccessModule(role, module.key)) return <GoHome from={path} />;
  return <>{children}</>;
}

function ModulePage({ path, children }: { path: string; children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  const { feature, featureKey } = useActiveFeature();
  const { search } = useLocation();
  const view = new URLSearchParams(search).get("view");
  const base = MODULE_TITLES[path] ?? "";
  const title = feature?.label ? `${base} · ${feature.label}` : base;
  const dash = !!role && DASH_ROLES.has(role);
  const adminHome = role === Role.SUPER_ADMIN && path === "/" && view !== "events";
  if (role === Role.CHAIRMAN && path === "/") return <Navigate to="/chairman" replace />;
  const commandDesk =
    path === "/calendar" ||
    path === "/tasks" ||
    path === "/approvals" ||
    path.startsWith("/ticketing") ||
    path === "/finance" ||
    path === "/procurement" ||
    path === "/hrm";
  const board =
    dash &&
    !featureKey &&
    ((view === "settings" || view === "help") ||
      (path === "/finance" && role === Role.FINANCE_CONTROLLER) ||
      (path === "/hrm" && role === Role.HR_MANAGER) ||
      (path === "/bookings" && role === Role.BOOKINGS_OFFICER && view !== "records") ||
      adminHome);
  let body: ReactNode;
  if (dash && (view === "settings" || view === "help") && !featureKey) body = <DashSettings kind={view} />;
  else if (dash && path === "/finance" && role === Role.FINANCE_CONTROLLER && !featureKey) body = <RevenueDashboard />;
  else if (dash && path === "/hrm" && role === Role.HR_MANAGER && !featureKey) body = <HrDashboard />;
  else if (dash && path === "/bookings" && role === Role.BOOKINGS_OFFICER && !featureKey && view !== "records") body = <BookingDashboard />;
  else if (adminHome && !featureKey) body = <SuperAdminDashboard />;
  else if (path === "/" || commandDesk) body = children;
  else if (view === "records" && !featureKey && RECORD_PAGES.has(path)) body = children;
  else if (isRegistryFeature(featureKey)) body = <SpecModulePage />;
  else if (featureKey) body = <FeatureWorkspace key={featureKey} />;
  else body = <ModuleHub />;
  if (dash && role === Role.CHAIRMAN)
    return (
      <ReadOnlyContext.Provider value>
        <DashFrame light={!(view === "settings" || view === "help")}>{body}</DashFrame>
      </ReadOnlyContext.Provider>
    );
  if (dash) return <DashFrame light={!board}>{body}</DashFrame>;
  return <AppShell title={title}>{body}</AppShell>;
}

function SecurityHome() {
  const role = useAuthStore((s) => s.user?.role);
  const view = new URLSearchParams(useLocation().search).get("view");
  return (
    <ReadOnlyContext.Provider value={role === Role.CHAIRMAN}>
      <DashFrame light={view === "records"}>
        {view === "settings" || view === "help" ? <DashSettings kind={view} /> : view === "records" ? <SecurityRegisters /> : <SecurityDashboard />}
      </DashFrame>
    </ReadOnlyContext.Provider>
  );
}

function RequireChair({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  if (role === Role.CHAIRMAN || role === Role.SUPER_ADMIN) return <>{children}</>;
  return <Navigate to={roleHomePath(role)} replace />;
}

function useChairFrame() {
  const role = useAuthStore((s) => s.user?.role);
  return role === Role.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.CHAIRMAN;
}

function ChairHome() {
  const frame = useChairFrame();
  const view = new URLSearchParams(useLocation().search).get("view");
  if (view === "settings" || view === "help")
    return (
      <DashFrame roleKey={frame}>
        <DashSettings kind={view} roleKey={frame} />
      </DashFrame>
    );
  return <ChairmanDashboard />;
}

const DRILLS: Record<string, { Page: () => JSX.Element; photo: boolean }> = {
  revenue: { Page: RevenueDashboard, photo: false },
  hr: { Page: HrDashboard, photo: true },
  booking: { Page: BookingDashboard, photo: true },
  security: { Page: SecurityDashboard, photo: true },
};

function ChairDrill({ name }: { name: string }) {
  const { Page, photo } = DRILLS[name];
  const frame = useChairFrame();
  return (
    <ReadOnlyContext.Provider value={frame === Role.CHAIRMAN}>
      <DashFrame roleKey={frame} photo={photo}>
        <Page />
      </DashFrame>
    </ReadOnlyContext.Provider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/tickets" element={<TicketsHome />} />
      <Route path="/tickets/events" element={<EventsListPage />} />
      <Route path="/tickets/events/:id" element={<EventPage />} />
      <Route path="/tickets/orders/:reference/checkout" element={<CheckoutPage />} />
      <Route path="/tickets/orders/:reference" element={<OrderPage />} />
      <Route path="/tickets/my" element={<MyBookingsPage />} />
      <Route path="/tickets/help" element={<HelpPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <ModulePage path="/">
              <CommandCentre />
            </ModulePage>
          </RequireAuth>
        }
      />
      {NAV.flatMap((g) => g.modules).map((mod) => {
        const Page = MODULE_PAGES[mod.path];
        return (
          <Route
            key={mod.key}
            path={mod.path}
            element={
              <RequireAuth>
                <RequireModule path={mod.path}>
                  <ModulePage path={mod.path}>
                    {Page && <Page />}
                  </ModulePage>
                </RequireModule>
              </RequireAuth>
            }
          />
        );
      })}
      <Route
        path="/security"
        element={
          <RequireAuth>
            <RequireModule path="/security">
              <SecurityHome />
            </RequireModule>
          </RequireAuth>
        }
      />
      <Route
        path="/chairman"
        element={
          <RequireAuth>
            <RequireChair>
              <ChairHome />
            </RequireChair>
          </RequireAuth>
        }
      />
      {Object.keys(DRILLS).map((name) => (
        <Route
          key={name}
          path={`/chairman/${name}`}
          element={
            <RequireAuth>
              <RequireChair>
                <ChairDrill name={name} />
              </RequireChair>
            </RequireAuth>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
