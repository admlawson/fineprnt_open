import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import { Documents } from "./pages/Documents";
import { OrgAdmin } from "./pages/admin/OrgAdmin";
import { PlatformAdmin } from "./pages/admin/PlatformAdmin";
import { AppLayout } from "./components/layout/AppLayout";
import AccountPage from "./pages/Account";
import NotFound from "./pages/NotFound";
import { ContactSales } from "./components/auth/ContactSales";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ScrollToTop from "@/components/navigation/ScrollToTop";
import CompleteInvite from "./pages/CompleteInvite";
import AuthInviteFlow from "./pages/auth/AuthInviteFlow";
import AuthVerify from "./pages/auth/AuthVerify";
import AuthError from "./pages/auth/AuthError";
import AuthReset from "./pages/auth/AuthReset";
import AuthOpen from "./pages/auth/AuthOpen";
import AuthCode from "./pages/auth/AuthCode";
import AuthNewPassword from "./pages/auth/AuthNewPassword";
import AuthHashHandler from "./components/auth/AuthHashHandler";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Role-based route wrapper
const RoleProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: string[] 
}> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/hash" element={<AuthHashHandler />} />
              <Route path="/auth/complete-invite" element={<AuthInviteFlow />} />
              <Route path="/complete-invite" element={<CompleteInvite />} />
              <Route path="/auth/verify" element={<AuthVerify />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/auth/reset" element={<AuthReset />} />
              <Route path="/auth/open" element={<AuthOpen />} />
              <Route path="/auth/code" element={<AuthCode />} />
              <Route path="/auth/new-password" element={<AuthNewPassword />} />
              <Route path="/termsofservice" element={<TermsOfService />} />
              <Route path="/privacypolicy" element={<PrivacyPolicy />} />
              
              {/* Protected app routes */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/app/documents" replace />} />
                <Route path="chat" element={<Chat />} />
                <Route path="documents" element={<Documents />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="contact-sales" element={<ContactSales />} />
                
                {/* Admin routes */}
                <Route path="admin/org" element={
                  <RoleProtectedRoute allowedRoles={['org_admin', 'platform_owner']}>
                    <OrgAdmin />
                  </RoleProtectedRoute>
                } />
                <Route path="admin/platform" element={
                  <RoleProtectedRoute allowedRoles={['platform_owner']}>
                    <PlatformAdmin />
                  </RoleProtectedRoute>
                } />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
