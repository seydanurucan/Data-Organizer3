import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Explain from "@/pages/explain";
import Favorites from "@/pages/favorites";
import Quiz from "@/pages/quiz";
import Scores from "@/pages/scores";
import Chat from "@/pages/chat";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to={`/auth/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/register" component={Register} />
        
        <Route path="/">
          {(params) => <ProtectedRoute component={Home} {...params} />}
        </Route>
        <Route path="/explain/:term">
          {(params) => <ProtectedRoute component={Explain} {...params} />}
        </Route>
        <Route path="/favorites">
          {(params) => <ProtectedRoute component={Favorites} {...params} />}
        </Route>
        <Route path="/quiz/:term">
          {(params) => <ProtectedRoute component={Quiz} {...params} />}
        </Route>
        <Route path="/scores">
          {(params) => <ProtectedRoute component={Scores} {...params} />}
        </Route>
        <Route path="/chat">
          {(params) => <ProtectedRoute component={Chat} {...params} />}
        </Route>
        <Route path="/chat/:id">
          {(params) => <ProtectedRoute component={Chat} {...params} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
