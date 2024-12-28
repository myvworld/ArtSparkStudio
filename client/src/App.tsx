import { Switch, Route } from "wouter";
import { useUser } from "./hooks/use-user";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
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
        <nav className="container flex items-center justify-between h-16">
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
          </div>
          <div className="flex items-center gap-4">
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
          <Route path="/subscription" component={Subscription} />
          <Route path="/settings" component={Settings} />
          <Route>
            <Home />
          </Route>
        </Switch>
      </main>
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