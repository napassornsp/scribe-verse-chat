import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import OCR from "./pages/OCR";
import VisionAI from "./pages/VisionAI";
import SidebarShell from "./components/layout/SidebarShell";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
           <Routes>
             <Route path="/" element={<Index />} />
             <Route path="/auth" element={<Auth />} />
             <Route path="/login" element={<Auth />} />
             <Route path="/register" element={<Auth />} />

             <Route element={<SidebarShell />}>
               <Route path="/home" element={<Home />} />
               <Route path="/notifications" element={<Notifications />} />
               <Route path="/help" element={<Help />} />
               <Route path="/profile" element={<Profile />} />
               <Route path="/pricing" element={<Pricing />} />
               <Route path="/ocr" element={<OCR />} />
               <Route path="/vision" element={<VisionAI />} />
             </Route>

             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
             <Route path="*" element={<NotFound />} />
           </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
