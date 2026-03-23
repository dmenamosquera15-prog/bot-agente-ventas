import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 5000, retry: 1 } },
});

function Router() {
  return (
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
        <Route path="/config" component={Config} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
