import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

type UserData = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Clean old cache on first load to avoid stale role data
  useEffect(() => {
    // Check if this is a fresh session by checking sessionStorage flag
    const isNewSession = !sessionStorage.getItem("kppu_session_started");
    if (isNewSession) {
      // Clear old cache
      localStorage.removeItem("kppu_user_cache");
      localStorage.removeItem("kppu_user");
      sessionStorage.setItem("kppu_session_started", "true");
    }
  }, []);

  // Function to load user data from database with caching
  const loadUserData = useCallback(
    async (userId: string, email: string, forceRefresh = false) => {
      try {
        // Check cache first (unless force refresh)
        // Note: Even with forceRefresh, we check cache but will update it
        const cached = localStorage.getItem("kppu_user_cache");
        if (cached && !forceRefresh) {
          const { data, timestamp } = JSON.parse(cached);
          if (data.id === userId && Date.now() - timestamp < CACHE_DURATION) {
            setUser(data);
            setIsAdmin(data.role === "admin");
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data from database
        // Use a single query with join-like approach using Promise.all
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("name")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        const userData: UserData = {
          id: userId,
          email: email,
          name: profileResult.data?.name || email?.split("@")[0] || "User",
          role: roleResult.data?.role || "user",
        };

        setUser(userData);
        setIsAdmin(userData.role === "admin");

        // Cache the user data
        localStorage.setItem(
          "kppu_user_cache",
          JSON.stringify({
            data: userData,
            timestamp: Date.now(),
          })
        );
        localStorage.setItem("kppu_user", JSON.stringify(userData));
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to cached data or null
        const storedUser = localStorage.getItem("kppu_user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAdmin(userData.role === "admin");
          } catch {
            setUser(null);
            setIsAdmin(false);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial session check - optimized
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Get session once
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && isMounted) {
          // Always force refresh on initial load to get latest role from database
          await loadUserData(session.user.id, session.user.email || "", true);
        } else if (isMounted) {
          // Check for stored user as fallback
          const storedUser = localStorage.getItem("kppu_user");
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsAdmin(userData.role === "admin");
            } catch {
              localStorage.removeItem("kppu_user");
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes - but debounced
    let authTimeout: NodeJS.Timeout;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Debounce rapid auth changes
      clearTimeout(authTimeout);
      authTimeout = setTimeout(async () => {
        if (session?.user) {
          // Always refresh on SIGN_IN or TOKEN_REFRESHED
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await loadUserData(session.user.id, session.user.email || "", true);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAdmin(false);
          localStorage.removeItem("kppu_user");
          localStorage.removeItem("kppu_user_cache");
          setLoading(false);
        }
      }, 100);
    });

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Exposed refresh function for manual refresh
  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserData(session.user.id, session.user.email || "", true);
    }
  }, [loadUserData]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Force refresh to get latest user data
        await loadUserData(data.user.id, data.user.email || "", true);
        // Note: loading will be set to false by loadUserData finally block
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: "Email atau password salah" };
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: "Terjadi kesalahan saat login" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { success: false, error: "Email sudah terdaftar" };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile and user role in parallel
        await Promise.all([
          supabase.from("profiles").insert({
            user_id: data.user.id,
            name,
            phone: phone || null,
          }),
          supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "user",
          }),
        ]);

        return { success: true };
      }
      return { success: false, error: "Terjadi kesalahan saat registrasi" };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Terjadi kesalahan saat registrasi",
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("kppu_user");
    localStorage.removeItem("kppu_user_cache");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, signIn, signUp, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
