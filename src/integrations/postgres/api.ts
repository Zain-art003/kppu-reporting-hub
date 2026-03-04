import { query } from "./client";
import * as crypto from "crypto";

// Hash password using simple hashing (for demo - use bcrypt in production)
const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

export const auth = {
  async signup(email: string, password: string, name: string) {
    try {
      const hashedPassword = hashPassword(password);
      const result = await query(
        "INSERT INTO public.users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name",
        [email, hashedPassword, name]
      );
      return { success: true, user: result.rows[0] };
    } catch (error: any) {
      if (error.code === "23505") {
        return { success: false, error: "Email sudah terdaftar" };
      }
      return { success: false, error: error.message };
    }
  },

  async login(email: string, password: string) {
    try {
      const hashedPassword = hashPassword(password);
      const result = await query(
        "SELECT id, email, name FROM public.users WHERE email = $1 AND password = $2",
        [email, hashedPassword]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Email atau password salah" };
      }

      return { success: true, user: result.rows[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getUserById(userId: string) {
    try {
      const result = await query(
        "SELECT id, email, name FROM public.users WHERE id = $1",
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async getUserRole(userId: string) {
    try {
      const result = await query(
        "SELECT role FROM public.user_roles WHERE user_id = $1",
        [userId]
      );
      return result.rows[0]?.role || "user";
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

      const result = await query(
        `INSERT INTO public.reports (
          user_id, ticket_number, institution_type, unit_work, reported_name,
          reported_position, incident_time, report_description, evidence_urls, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          userId,
          ticketNumber,
          reportData.institution_type,
          reportData.unit_work,
          reportData.reported_name,
          reportData.reported_position,
          reportData.incident_time,
          reportData.report_description,
          reportData.evidence_urls || [],
          "submitted",
        ]
      );
      return { success: true, report: result.rows[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getUserReports(userId: string) {
    try {
      const result = await query(
        "SELECT * FROM public.reports WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      return result.rows;
    } catch (error: any) {
      console.error("Error getting reports:", error);
      return [];
    }
  },

  async getReportById(reportId: string) {
    try {
      const result = await query("SELECT * FROM public.reports WHERE id = $1", [
        reportId,
      ]);
      return result.rows[0] || null;
    } catch (error: any) {
      console.error("Error getting report:", error);
      return null;
    }
  },

  async getAllReports() {
    try {
      const result = await query(
        "SELECT * FROM public.reports ORDER BY created_at DESC"
      );
      return result.rows;
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
      const reportResult = await query(
        "UPDATE public.reports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [status, reportId]
      );

      if (timeline_description) {
        await query(
          "INSERT INTO public.report_timeline (report_id, status, description) VALUES ($1, $2, $3)",
          [reportId, status, timeline_description]
        );
      }

      return { success: true, report: reportResult.rows[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const timeline = {
  async getReportTimeline(reportId: string) {
    try {
      const result = await query(
        "SELECT * FROM public.report_timeline WHERE report_id = $1 ORDER BY created_at ASC",
        [reportId]
      );
      return result.rows;
    } catch (error: any) {
      console.error("Error getting timeline:", error);
      return [];
    }
  },
};

export const profiles = {
  async getProfile(userId: string) {
    try {
      const result = await query(
        "SELECT * FROM public.profiles WHERE user_id = $1",
        [userId]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      console.error("Error getting profile:", error);
      return null;
    }
  },

  async updateProfile(userId: string, name: string, phone?: string) {
    try {
      const result = await query(
        "UPDATE public.profiles SET name = $1, phone = $2, updated_at = NOW() WHERE user_id = $3 RETURNING *",
        [name, phone || null, userId]
      );
      return { success: true, profile: result.rows[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
