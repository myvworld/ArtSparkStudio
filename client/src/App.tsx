import { Switch, Route } from "wouter";
import { useUser } from "./hooks/use-user";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/ui/footer";
import { Loader2 } from "lucide-react";

import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import Analytics from "./pages/Analytics";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
const Terms = () => import("./pages/Terms").then(module => module.default);
const Copyright = () => import("./pages/Copyright").then(module => module.default);
import { Button } from "./components/ui/button";
import { useLocation } from "wouter";

function App() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-6">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              asChild
            >
              <a href="/">Home</a>
            </Button>
            <Button
              variant={location === "/dashboard" ? "default" : "ghost"}
              asChild
            >
              <a href="/dashboard">Dashboard</a>
            </Button>
            <Button
              variant={location === "/gallery" ? "default" : "ghost"}
              asChild
            >
              <a href="/gallery">Community Gallery</a>
            </Button>
            <Button
              variant={location === "/analytics" ? "default" : "ghost"}
              asChild
            >
              <a href="/analytics">Analytics</a>
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {user.isAdmin && (
              <Button
                variant={location === "/admin" ? "default" : "ghost"}
                asChild
              >
                <a href="/admin">Admin Dashboard</a>
              </Button>
            )}
            <Button
              variant={location === "/subscription" ? "default" : "ghost"}
              asChild
            >
              <a href="/subscription">Subscription</a>
            </Button>
            <Button
              variant={location === "/settings" ? "default" : "ghost"}
              asChild
            >
              <a href="/settings">Settings</a>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/terms" component={Terms} />
          <Route path="/copyright" component={Copyright} />
          <Route>
            <Home />
          </Route>
        </Switch>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}