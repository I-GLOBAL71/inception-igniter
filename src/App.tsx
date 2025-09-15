import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CurrencyProvider } from "./hooks/useCurrency.tsx";
import { SoundProvider } from "./hooks/useSound.tsx";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthSuccess from "./pages/auth/Success";
import AuthCancel from "./pages/auth/Cancel";
import AuthError from "./pages/auth/Error";
import AuthCallback from "./pages/auth/Callback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SoundProvider>
      <BrowserRouter>
        <CurrencyProvider>
          <TooltipProvider>
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route path="/auth/cancel" element={<AuthCancel />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </CurrencyProvider>
      </BrowserRouter>
    </SoundProvider>
  </QueryClientProvider>
);

export default App;
