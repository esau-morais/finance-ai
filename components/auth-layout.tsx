"use client";
import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const authRoutes = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const isAuthed = !!data.user;
        setIsAuthenticated(isAuthed);

        if (!isAuthed && !authRoutes.includes(pathname)) {
          router.push(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authRoutes.includes(pathname) || pathname.startsWith("/auth/")) {
    return children;
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return children;
}
