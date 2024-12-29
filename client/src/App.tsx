import { Switch, Route } from "wouter";
import { useUser } from "./hooks/use-user";
import { useLocation } from "wouter";
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
import Terms from "./pages/Terms";
import Copyright from "./pages/Copyright";
import Privacy from "./pages/Privacy";
import { Button } from "./components/ui/button";

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

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <AuthPage />;
    }
    return <>{children}</>;
  };

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
            {user ? (
              <>
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
                <Button 
                  variant="outline"
                  onClick={() => {
                    logout();
                    setLocation("/");
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/")}
                >
                  Login
                </Button>
                <Button
                  variant="default"
                  onClick={() => setLocation("/")}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/gallery">
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          </Route>
          <Route path="/analytics">
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          </Route>
          <Route path="/subscription">
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Route>
          <Route path="/admin">
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
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