"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  useEffect(() => {
    const sb = supabaseBrowser();
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await sb.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          router.replace("/login");
          return;
        }
        
        if (!session) {
          router.replace("/login");
          return;
        }
        
        setUser(session.user);
        setIsAuthenticated(true);
        setReady(true);
      } catch (err) {
        console.error("Auth error:", err);
        router.replace("/login");
      }
    };
    
    getInitialSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setUser(null);
        router.replace("/login");
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user);
        setIsAuthenticated(true);
        setReady(true);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 text-center bg-white rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
          <div className="text-sm text-gray-500 mt-2">Checking authentication</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 text-center bg-white rounded-lg shadow-sm">
          <div className="text-red-600 mb-4">Authentication Required</div>
          <div className="text-gray-600 mb-4">Please sign in to access this page.</div>
          <button
            onClick={() => router.push("/login")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
