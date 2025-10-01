import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Landing } from "./pages/Landing";
import { Chat } from "./pages/Chat";
import { Documents } from "./pages/Documents";
import { AppLayout } from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ScrollToTop from "@/components/navigation/ScrollToTop";

const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/termsofservice" element={<TermsOfService />} />
            <Route path="/privacypolicy" element={<PrivacyPolicy />} />
            
            {/* App routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/documents" replace />} />
              <Route path="chat" element={<Chat />} />
              <Route path="documents" element={<Documents />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
