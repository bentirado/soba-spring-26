import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigError } from "@/lib/supabase";

type SignUpProfile = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type AppRole = "admin" | "staff" | "viewer";

export type UserProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: AppRole;
};

type AuthResult = {
  error?: string;
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  configError: string;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    profile: SignUpProfile,
  ) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    if (!supabase) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id,email,first_name,last_name,phone,role")
      .eq("id", userId)
      .single<UserProfile>();

    if (error) {
      console.error("Failed to load user profile:", error.message);
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const role = profile?.role ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      configError: supabaseConfigError,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      role,
      isAdmin: role === "admin",
      isStaff: role === "admin" || role === "staff",
      isViewer: role === "viewer",
      async refreshProfile() {
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      },
      async signIn(email, password) {
        if (!supabase) {
          return { error: supabaseConfigError };
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        return error ? { error: error.message } : {};
      },
      async signOut() {
        if (!supabase) {
          return { error: supabaseConfigError };
        }

        const { error } = await supabase.auth.signOut();
        return error ? { error: error.message } : {};
      },
      async signUp(email, password, profile) {
        if (!supabase) {
          return { error: supabaseConfigError };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: profile.firstName,
              last_name: profile.lastName,
              phone: profile.phone,
            },
          },
        });

        if (error) {
          return { error: error.message };
        }

        return { needsEmailConfirmation: !data.session };
      },
    }),
    [loading, profile, role, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
