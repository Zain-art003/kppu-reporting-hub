// @ts-nocheck
// Deno Email Service for Deno Deploy
// Deploy ke: https://dash.deno.com

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { to, userName, ticketNumber, status } = await req.json();

    if (!to || !ticketNumber || !status) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMTP config from environment
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = Deno.env.get("SMTP_PORT") || "587";
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "zainfahri003@gmail.com";

    if (!smtpUsername || !smtpPassword) {
      return new Response(
        JSON.stringify({ ok: false, error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create email
    const html = createEmailHtml(userName || "Pengguna", ticketNumber, status);
    
    // Simple SMTP command via raw TCP (works in Deno)
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: parseInt(smtpPort),
    });

    // Read greeting
    let response = await readResponse(conn, decoder);
    console.log("SMTP Greeting:", response);

    // EHLO
    await conn.write(encoder.encode("EHLO localhost\r\n"));
    response = await readResponse(conn, decoder);
    console.log("EHLO Response:", response);

    // AUTH LOGIN
    await conn.write(encoder.encode("AUTH LOGIN\r\n"));
    response = await readResponse(conn, decoder);
    console.log("AUTH:", response);

    // Username (base64)
    await conn.write(encoder.encode(btoa(smtpUsername) + "\r\n"));
    response = await readResponse(conn, decoder);
    console.log("USER:", response);

    // Password (base64)
    await conn.write(encoder.encode(btoa(smtpPassword) + "\r\n"));
    response = await readResponse(conn, decoder);
    console.log("PASS:", response);

    if (!response.startsWith("235")) {
      conn.close();
      return new Response(
        JSON.stringify({ ok: false, error: "SMTP auth failed", details: response }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MAIL FROM
    await conn.write(encoder.encode(`MAIL FROM:<${fromEmail}>\r\n`));
    response = await readResponse(conn, decoder);

    // RCPT TO
    await conn.write(encoder.encode(`RCPT TO:<${to}>\r\n`));
    response = await readResponse(conn, decoder);

    // DATA
    await conn.write(encoder.encode("DATA\r\n"));
    response = await readResponse(conn, decoder);

    // Email content
    const emailContent = `From: KPPU WBS <${fromEmail}>\r\nTo: ${to}\r\nSubject: Notifikasi: Status Laporan ${ticketNumber}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}\r\n.\r\n`;
    
    await conn.write(encoder.encode(emailContent));
    response = await readResponse(conn, decoder);
    console.log("DATA Response:", response);

    // QUIT
    await conn.write(encoder.encode("QUIT\r\n"));
    conn.close();

    return new Response(
      JSON.stringify({ ok: true, email_sent: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function readResponse(conn: Deno.Conn, decoder: TextDecoder): Promise<string> {
  const buffer = new Uint8Array(1024);
  const n = await conn.read(buffer);
  return decoder.decode(buffer.slice(0, n));
}