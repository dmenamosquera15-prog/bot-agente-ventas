import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ChatTest from "@/pages/ChatTest";
import Conversations from "@/pages/Conversations";
import Clients from "@/pages/Clients";
import Products from "@/pages/Products";
import Agents from "@/pages/Agents";
import AgentsEditor from "@/pages/AgentsEditor";
import Config from "@/pages/Config";
import WhatsApp from "@/pages/WhatsApp";
import AiProviders from "@/pages/AiProviders";
import ImportProducts from "@/pages/ImportProducts";
import GitSync from "@/pages/GitSync";
import GitHubCopilot from "@/pages/GitHubCopilot";
import AdminCopilot from "@/pages/AdminCopilot";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Membership from "@/pages/Membership";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 5000, retry: 1 },
  },
});

function Router() {
  const [location, navigate] = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const publicPaths = ["/landing", "/auth"];
    if (!token && !publicPaths.includes(location)) {
      navigate("/landing");
    }
  }, [token, location, navigate]);

  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route>
        {token ? (
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/whatsapp" component={WhatsApp} />
              <Route path="/chat" component={ChatTest} />
              <Route path="/conversations" component={Conversations} />
              <Route path="/clients" component={Clients} />
              <Route path="/products" component={Products} />
              <Route path="/products/import" component={ImportProducts} />
              <Route path="/agents" component={Agents} />
              <Route path="/agents/edit" component={AgentsEditor} />
              <Route path="/ai-providers" component={AiProviders} />
              <Route path="/git-sync" component={GitSync} />
              <Route path="/github-copilot" component={GitHubCopilot} />
              <Route path="/admin-copilot" component={AdminCopilot} />
              <Route path="/config" component={Config} />
              <Route path="/membership" component={Membership} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        ) : (
          <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
