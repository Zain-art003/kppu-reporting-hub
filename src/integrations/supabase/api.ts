import { supabase } from "./client";

export const auth = {
  async signup(email: string, password: string, name: string) {
    try {
      // First, create the auth user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          return { success: false, error: "Email sudah terdaftar" };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Gagal membuat pengguna" };
      }

      // Then create the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          name,
          email,
        });

      if (profileError) {
        // If profile creation fails, we might want to clean up the auth user
        console.error("Profile creation error:", profileError);
        return { success: false, error: profileError.message };
      }

      // Also create default user role
      await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "user",
        });

      return { 
        success: true, 
        user: { 
          id: authData.user.id, 
          email: authData.user.email, 
          name 
        } 
      };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }
  },

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { success: false, error: "Email atau password salah" };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Gagal masuk" };
      }

      // Get the profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", data.user.id)
        .maybeSingle();

      return { 
        success: true, 
        user: { 
          id: data.user.id, 
          email: data.user.email, 
          name: profile?.name || data.user.email?.split('@')[0]
        } 
      };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async getUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data?.role || "user";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "user";
    }
  },
};

export const reports = {
  async create(userId: string, reportData: any) {
    try {
      // Generate ticket number
      const ticketNumber = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from("reports")
        .insert({
          user_id: userId,
          ticket_number: ticketNumber,
          institution_type: reportData.institution_type,
          unit_work: reportData.unit_work,
          reported_name: reportData.reported_name,
          reported_position: reportData.reported_position,
          incident_time: reportData.incident_time,
          report_description: reportData.report_description,
          evidence_urls: reportData.evidence_urls || [],
          status: "submitted",
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, report: data };
    } catch (error: any) {
      console.error("Error creating report:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserReports(userId: string) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error getting reports:", error);
      return [];
    }
  },

  async getReportById(reportId: string) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error: any) {
      console.error("Error getting report:", error);
      return null;
    }
  },

  async getAllReports() {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error getting all reports:", error);
      return [];
    }
  },

  async updateStatus(
    reportId: string,
    status: string,
    timeline_description?: string
  ) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", reportId)
        .select()
        .single();

      if (error) throw error;

      if (timeline_description) {
        const { error: timelineError } = await supabase
          .from("report_timeline")
          .insert({
            report_id: reportId,
            status,
            description: timeline_description,
          });

        if (timelineError) throw timelineError;
      }

      return { success: true, report: data };
    } catch (error: any) {
      console.error("Error updating status:", error);
      return { success: false, error: error.message };
    }
  },
};

export const timeline = {
  async getReportTimeline(reportId: string) {
    try {
      const { data, error } = await supabase
        .from("report_timeline")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error getting timeline:", error);
      return [];
    }
  },
};

export const profiles = {
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error: any) {
      console.error("Error getting profile:", error);
      return null;
    }
  },

  async updateProfile(userId: string, name: string, phone?: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          name,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, profile: data };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
  },
};