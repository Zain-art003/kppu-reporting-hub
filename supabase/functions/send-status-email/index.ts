// @ts-nocheck - Deno types not available in VS Code
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Email HTML Template
const createEmailHtml = (userName: string, ticketNumber: string, status: string) => {
  const statusLabels: Record<string, string> = {
    submitted: "Diterima",
    in_review: "Sedang Ditelaah",
    in_progress: "Dalam Proses",
    completed: "Selesai",
    rejected: "Ditolak",
  };
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Notifikasi Status Laporan WBS KPPU</h2>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Yth. <strong>${userName}</strong>,</p>
        <p>Status laporan Anda telah diperbarui:</p>
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 8px 0;"><strong>Nomor Tiket:</strong> ${ticketNumber}</p>
          <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${statusLabels[status] || status}</span></p>
        </div>
        <p style="margin-top: 16px;">Masuk ke dashboard untuk detail lengkap.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          Sistem Pengaduan Whistleblowing KPPU
        </p>
      </div>
    </div>
  `;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("send-status-email: Function triggered", req.method);

  // Log all request headers for debugging
  console.log("send-status-email: Request headers:", {
    contentType: req.headers.get("content-type"),
    contentLength: req.headers.get("content-length"),
    authorization: req.headers.get("authorization") ? "present" : "missing",
  });

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("send-status-email: SUPABASE_URL present:", !!supabaseUrl);
    console.log("send-status-email: SUPABASE_SERVICE_ROLE_KEY present:", !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("send-status-email: Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let body: any;
    let text = "";
    
    try {
      text = await req.text();
      console.log("send-status-email: Raw request body:", text);
      console.log("send-status-email: Body length:", text?.length);

      if (!text || text.trim() === "") {
        console.error("send-status-email: Empty request body received");
        return new Response(JSON.stringify({ error: "Empty request body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      body = JSON.parse(text);
      console.log("send-status-email: Parsed body:", body);
    } catch (e) {
      console.error("send-status-email: JSON parse error:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", details: String(e) }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Support both snake_case and camelCase
    const report_id = body?.report_id || body?.reportId || body?.report_id || null;
    const new_status = body?.new_status || body?.newStatus || body?.status || null;

    console.log(
      "send-status-email: Extracted - report_id:",
      report_id,
      "new_status:",
      new_status
    );

    if (!report_id) {
      console.error("send-status-email: Missing report_id");
      return new Response(
        JSON.stringify({ error: "Missing required field: report_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!new_status) {
      console.error("send-status-email: Missing new_status");
      return new Response(
        JSON.stringify({ error: "Missing required field: new_status" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get report and user info
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("ticket_number, user_id")
      .eq("id", report_id)
      .single();

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: "Report not found", details: reportError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's email from auth.users
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(report.user_id);

    if (authError || !authUser?.user?.email) {
      console.error("send-status-email: User email not found:", authError);
      return new Response(
        JSON.stringify({ ok: true, email_sent: false, reason: "User email not found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get profile name if available
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", report.user_id)
      .maybeSingle();

    const userEmail = authUser.user.email;
    const userName = profile?.name || authUser.user.email?.split("@")[0] || "Pengguna";

    console.log("send-status-email: Sending to:", userEmail);

    // Get external email service URL
    const emailServiceUrl = Deno.env.get("EMAIL_SERVICE_URL");
    
    if (!emailServiceUrl) {
      console.error("send-status-email: Missing EMAIL_SERVICE_URL");
      return new Response(
        JSON.stringify({
          ok: false,
          email_sent: false,
          reason: "Email service not configured"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email via external Node.js service
    try {
      const response = await fetch(`${emailServiceUrl}/send-status-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userEmail,
          userName: userName,
          ticketNumber: report.ticket_number,
          status: new_status,
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.ok) {
        console.error("send-status-email: Email service error:", result);
        
        return new Response(
          JSON.stringify({
            ok: false,
            email_sent: false,
            reason: result.error || "Failed to send email",
            recipient: userEmail,
          }),
          {
            status: response.status || 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("send-status-email: Email sent successfully, messageId:", result.messageId);

      return new Response(JSON.stringify({ ok: true, email_sent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchError) {
      console.error("send-status-email: Fetch error:", fetchError);
      
      return new Response(
        JSON.stringify({
          ok: false,
          email_sent: false,
          reason: `Failed to connect email service: ${String(fetchError)}`,
          recipient: userEmail,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (e) {
    console.error("send-status-email: General error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
