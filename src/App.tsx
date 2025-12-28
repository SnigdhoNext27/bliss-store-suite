import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/lib/auth";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LiveChatWidget } from "@/components/chat/LiveChatWidget";
import { LoadingScreen } from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import OrderTracking from "./pages/OrderTracking";
import Category from "./pages/Category";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Customers from "./pages/admin/Customers";
import Coupons from "./pages/admin/Coupons";
import Banners from "./pages/admin/Banners";
import Settings from "./pages/admin/Settings";
import Team from "./pages/admin/Team";
import AdminChats from "./pages/admin/Chats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(() => {
    // Check localStorage for skip preference
    return localStorage.getItem('skipLoadingScreen') !== 'true';
  });

  useEffect(() => {
    if (!isLoading) return;
    
    // Show loading screen for 2.5 seconds on initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleSkipLoading = () => {
    setIsLoading(false);
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            <AnimatePresence mode="wait">
              {isLoading && <LoadingScreen onSkip={handleSkipLoading} />}
            </AnimatePresence>
            
            <AnimatePresence>
              {!isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <WhatsAppButton />
                  <LiveChatWidget />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/category/:slug" element={<Category />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/orders/:orderNumber" element={<OrderTracking />} />
                      
                      {/* Admin Routes */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="products" element={<Products />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="coupons" element={<Coupons />} />
                        <Route path="banners" element={<Banners />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="team" element={<Team />} />
                        <Route path="chats" element={<AdminChats />} />
                      </Route>
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </motion.div>
              )}
            </AnimatePresence>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
