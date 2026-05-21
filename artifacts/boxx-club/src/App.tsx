import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import EventDetail from "@/pages/EventDetail";
import ChiSiamo from "@/pages/ChiSiamo";
import Gallery from "@/pages/Gallery";
import RecuperaAdmin from "@/pages/RecuperaAdmin";
import Statistiche from "@/pages/Statistiche";
import { useTracker } from "@/hooks/useTracker";

const queryClient = new QueryClient();

function Router() {
  useTracker();
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/eventi/:id" component={EventDetail} />
      <Route path="/chi-siamo" component={ChiSiamo} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/statistiche" component={Statistiche} />
      <Route path="/admin/recupera" component={RecuperaAdmin} />
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
