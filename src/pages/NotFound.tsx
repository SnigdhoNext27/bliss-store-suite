import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-4 font-display text-6xl font-bold text-primary">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/" className="gap-2">
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/shop">Browse Shop</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
