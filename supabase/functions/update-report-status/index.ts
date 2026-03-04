// @ts-nocheck - Deno types not available in VS Code
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Resend API Key - set via secrets or use directly
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_58Xh6KFx_ML1ZSqqT5eMZvtbSaZgap1qy'

// Status labels for email
const statusLabels: Record<string, string> = {
  submitted: "Diterima",
  in_review: "Sedang Ditelaah",
  in_progress: "Dalam Proses",
  completed: "Selesai",
  rejected: "Ditolak"
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    console.log("update-report-status: Auth header present:", !!authHeader)
    
    if (!authHeader) {
      console.log("update-report-status: No auth header - returning 401")
      return new Response(
        JSON.stringify({ error: 'No authorization header - please login' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '')
    console.log("update-report-status: Token length:", token.length)

    // Create Supabase client with JWT verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    )

    // Get current user - this validates the JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    console.log("update-report-status: User from JWT:", user?.id, "error:", authError)
    
    if (authError || !user) {
      console.log("update-report-status: Auth failed - returning 401")
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token. Please login again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can update report status' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { report_id, new_status, admin_note } = await req.json()

    if (!report_id || !new_status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: report_id, new_status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current report data
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*, user_id')
      .eq('id', report_id)
      .single()

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const oldStatus = report.status

    // Update report status
    const { error: updateError } = await supabaseClient
      .from('reports')
      .update({ status: new_status, updated_at: new Date().toISOString() })
      .eq('id', report_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert status history (only if user is admin - validated above)
    const { error: historyError } = await supabaseClient
      .from('report_timeline')
      .insert({
        report_id,
        status: new_status,
        description: admin_note || `Status changed from ${oldStatus} to ${new_status}`,
        created_at: new Date().toISOString(),
      })

    if (historyError) {
      console.error('Error inserting history:', historyError)
    }

    // Get user's email from auth.users (not profiles - profiles doesn't have email column)
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(report.user_id)

    // Get profile name if available
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('user_id', report.user_id)
      .maybeSingle()

    const userEmail = authUser?.user?.email
    const userName = profile?.name || authUser?.user?.email?.split('@')[0] || 'Pengguna'

    // Send email notification (if email exists)
    let emailSent = false
    let emailError = null

    // Send email notification - MINIMAL INFO (no sensitive details)
    if (userEmail) {
      try {
        const resend = new Resend(RESEND_API_KEY)
        
        // SECURE: Only send status change notification, no sensitive details
        const { data, error: resendError } = await resend.emails.send({
          from: 'WBS KPPU <onboarding@resend.dev>',
          to: userEmail,
          subject: `Notifikasi: Status Laporan Anda - ${report.ticket_number}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Notifikasi Status Laporan WBS KPPU</h2>
              <p>Yth. <strong>${userName}</strong>,</p>
              
              <p>Status laporan pengaduan Anda telah diperbarui.</p>
              
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Nomor Laporan:</strong> ${report.ticket_number}</p>
                <p><strong>Status Baru:</strong> <span style="color: #059669; font-weight: bold;">${statusLabels[new_status] || new_status}</span></p>
              </div>
              
              <p style="color: #6b7280;">
                Untuk melihat detail lengkap dan riwayat perubahan, silakan masuk ke dashboard WBS KPPU.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #9ca3af; font-size: 11px;">
                Email ini dikirim secara otomatis oleh sistem WBS KPPU.
                Mohon tidak membalas email ini.<br>
                Demi keamanan data, kami tidak menyertakan detail laporan melalui email.
              </p>
            </div>
          `
        })

        if (resendError) {
          console.error('Resend error:', resendError)
          emailError = resendError.message
        } else {
          console.log('Email sent successfully:', data)
          emailSent = true
        }
      } catch (e) {
        emailError = e.message
        console.error('Error sending email:', e)
      }
    } else {
      console.log('No email found for user:', report.user_id, 'authError:', authError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Status updated successfully',
        email_sent: emailSent,
        email_error: emailError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})