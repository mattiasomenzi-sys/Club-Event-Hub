import React, { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { itIT } from "@clerk/localizations";
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
import Profilo from "@/pages/Profilo";
import { useTracker } from "@/hooks/useTracker";

const queryClient = new QueryClient();

// REQUIRED — copied verbatim from Clerk setup reference.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev, auto-set in prod. Do not gate on PROD/NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#FF006E",
    colorForeground: "#FFFFFF",
    colorMutedForeground: "#9CA3AF",
    colorDanger: "#EF4444",
    colorBackground: "#0A0A0A",
    colorInput: "#161616",
    colorInputForeground: "#FFFFFF",
    colorNeutral: "#FFFFFF",
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0A0A0A] border border-[#FF006E]/30 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-[0_0_40px_rgba(255,0,110,0.15)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-gray-400",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-gray-300",
    footerActionLink: "text-[#FF006E] hover:text-[#FF1493]",
    footerActionText: "text-gray-400",
    dividerText: "text-gray-500",
    identityPreviewEditButton: "text-[#FF006E]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "justify-center",
    logoImage: "h-10",
    socialButtonsBlockButton: "border border-white/20 hover:bg-white/10",
    formButtonPrimary: "bg-[#FF006E] hover:bg-[#FF1493] text-white font-bold",
    formFieldInput: "bg-[#161616] border-white/15 text-white",
    footerAction: "justify-center",
    dividerLine: "bg-white/15",
    alert: "border border-red-500/40",
    otpCodeFieldInput: "bg-[#161616] border-white/15 text-white",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

// Invalidate the query cache when the signed-in user changes.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  useTracker();
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/eventi/:id" component={EventDetail} />
      <Route path="/chi-siamo" component={ChiSiamo} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/profilo" component={Profilo} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/statistiche" component={Statistiche} />
      <Route path="/admin/recupera" component={RecuperaAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        ...itIT,
        signIn: {
          ...itIT.signIn,
          start: {
            ...itIT.signIn?.start,
            title: "Bentornatə",
            subtitle: "Accedi per partecipare agli eventi BOXX",
          },
        },
        signUp: {
          ...itIT.signUp,
          start: {
            ...itIT.signUp?.start,
            title: "Crea il tuo account",
            subtitle: "Unisciti alla community BOXX",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
