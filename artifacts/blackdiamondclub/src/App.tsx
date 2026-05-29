import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Recover from "@/pages/recover";
import Home from "@/pages/home";
import Games from "@/pages/games";
import Game from "@/pages/game";
import Wallet from "@/pages/wallet";
import Leaderboard from "@/pages/leaderboard";
import Profile from "@/pages/profile";

import { AppShell } from "@/components/layout/AppShell";
import { PublicShell } from "@/components/layout/PublicShell";
import { AdminShell, AdminGuard } from "@/components/layout/AdminShell";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminUserDetail from "@/pages/admin/user-detail";
import AdminTransactions from "@/pages/admin/transactions";
import AdminGames from "@/pages/admin/games";
import AdminSettings from "@/pages/admin/settings";

import Terms from "@/pages/legal/terms";
import Privacy from "@/pages/legal/privacy";
import ResponsibleGambling from "@/pages/legal/responsible-gambling";
import AML from "@/pages/legal/aml";

const queryClient = new QueryClient();

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <AdminGuard>
          <AdminShell><AdminDashboard /></AdminShell>
        </AdminGuard>
      </Route>
      <Route path="/admin/users/:id">
        <AdminGuard>
          <AdminShell><AdminUserDetail /></AdminShell>
        </AdminGuard>
      </Route>
      <Route path="/admin/users">
        <AdminGuard>
          <AdminShell><AdminUsers /></AdminShell>
        </AdminGuard>
      </Route>
      <Route path="/admin/transactions">
        <AdminGuard>
          <AdminShell><AdminTransactions /></AdminShell>
        </AdminGuard>
      </Route>
      <Route path="/admin/games">
        <AdminGuard>
          <AdminShell><AdminGames /></AdminShell>
        </AdminGuard>
      </Route>
      <Route path="/admin/settings">
        <AdminGuard>
          <AdminShell><AdminSettings /></AdminShell>
        </AdminGuard>
      </Route>
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin routes — match before wildcard */}
      <Route path="/admin/:rest*">
        <AdminRouter />
      </Route>

      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/recover" component={Recover} />

      {/* Protected user routes */}
      <Route path="/">
        <AppShell><Home /></AppShell>
      </Route>
      <Route path="/games">
        <AppShell><Games /></AppShell>
      </Route>
      <Route path="/game/:gameType">
        <AppShell><Game /></AppShell>
      </Route>
      <Route path="/wallet">
        <AppShell><Wallet /></AppShell>
      </Route>
      <Route path="/leaderboard">
        <AppShell><Leaderboard /></AppShell>
      </Route>
      <Route path="/profile">
        <AppShell><Profile /></AppShell>
      </Route>

      {/* Legal pages — public, no auth required */}
      <Route path="/legal/terms">
        <PublicShell><Terms /></PublicShell>
      </Route>
      <Route path="/legal/privacy">
        <PublicShell><Privacy /></PublicShell>
      </Route>
      <Route path="/legal/responsible-gambling">
        <PublicShell><ResponsibleGambling /></PublicShell>
      </Route>
      <Route path="/legal/aml">
        <PublicShell><AML /></PublicShell>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
