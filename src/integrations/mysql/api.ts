import { query } from "./client";

// Types
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "user" | "admin";
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: Date;
}

export interface Report {
  id: number;
  user_id: number;
  incident_date: Date;
  incident_location?: string;
  description?: string;
  evidence?: string;
  status: "pending" | "processing" | "resolved" | "rejected";
  ticket_number?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReportTimeline {
  id: number;
  report_id: number;
  status: string;
  description?: string;
  created_at: Date;
}

// Auth functions
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  phone?: string
) => {
  const hashedPassword = btoa(password); // Simple encoding (use bcrypt in production)

  const result = await query(
    "INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)",
    [email, hashedPassword, name, phone || null, "user"]
  );

  // Create profile
  const userId = (result as any).insertId;
  await query(
    "INSERT INTO profiles (user_id, name, email, phone) VALUES (?, ?, ?, ?)",
    [userId, name, email, phone || null]
  );

  return { id: userId, email, name, phone };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  const hashedPassword = btoa(password);
  const rows = (await query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, hashedPassword]
  )) as User[];

  return rows.length > 0 ? rows[0] : null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const rows = (await query("SELECT * FROM users WHERE id = ?", [
    id,
  ])) as User[];
  return rows.length > 0 ? rows[0] : null;
};

// Profile functions
export const getProfileByUserId = async (
  userId: number
): Promise<Profile | null> => {
  const rows = (await query("SELECT * FROM profiles WHERE user_id = ?", [
    userId,
  ])) as Profile[];
  return rows.length > 0 ? rows[0] : null;
};

export const updateProfile = async (
  userId: number,
  name: string,
  phone?: string
) => {
  await query("UPDATE profiles SET name = ?, phone = ? WHERE user_id = ?", [
    name,
    phone || null,
    userId,
  ]);
  await query("UPDATE users SET name = ?, phone = ? WHERE id = ?", [
    name,
    phone || null,
    userId,
  ]);
};

// Report functions
export const createReport = async (
  userId: number,
  incidentDate: string,
  location: string,
  description: string,
  evidence?: string
): Promise<number> => {
  // Generate ticket number
  const ticketNumber = `WBS-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;

  const result = await query(
    "INSERT INTO reports (user_id, incident_date, incident_location, description, evidence, ticket_number, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      userId,
      incidentDate,
      location,
      description,
      evidence || null,
      ticketNumber,
      "pending",
    ]
  );

  const reportId = (result as any).insertId;

  // Create initial timeline
  await query(
    "INSERT INTO report_timeline (report_id, status, description) VALUES (?, ?, ?)",
    [reportId, "pending", "Laporan berhasil diterima"]
  );

  return reportId;
};

export const getReportsByUserId = async (userId: number): Promise<Report[]> => {
  return (await query(
    "SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  )) as Report[];
};

export const getAllReports = async (): Promise<Report[]> => {
  return (await query(
    "SELECT r.*, u.name as user_name, u.email as user_email FROM reports r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC"
  )) as Report[];
};

export const getReportById = async (id: number): Promise<Report | null> => {
  const rows = (await query("SELECT * FROM reports WHERE id = ?", [
    id,
  ])) as Report[];
  return rows.length > 0 ? rows[0] : null;
};

export const getReportByTicket = async (
  ticketNumber: string
): Promise<Report | null> => {
  const rows = (await query("SELECT * FROM reports WHERE ticket_number = ?", [
    ticketNumber,
  ])) as Report[];
  return rows.length > 0 ? rows[0] : null;
};

export const updateReportStatus = async (
  id: number,
  status: string,
  description?: string
) => {
  await query("UPDATE reports SET status = ? WHERE id = ?", [status, id]);

  if (description) {
    await query(
      "INSERT INTO report_timeline (report_id, status, description) VALUES (?, ?, ?)",
      [id, status, description]
    );
  }
};

// Timeline functions
export const getReportTimeline = async (
  reportId: number
): Promise<ReportTimeline[]> => {
  return (await query(
    "SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at ASC",
    [reportId]
  )) as ReportTimeline[];
};

// Admin functions
export const getAdminStats = async () => {
  const totalReports = await query("SELECT COUNT(*) as count FROM reports");
  const pendingReports = await query(
    "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"
  );
  const processingReports = await query(
    "SELECT COUNT(*) as count FROM reports WHERE status = 'processing'"
  );
  const resolvedReports = await query(
    "SELECT COUNT(*) as count FROM reports WHERE status = 'resolved'"
  );

  return {
    total: (totalReports as any[])[0]?.count || 0,
    pending: (pendingReports as any[])[0]?.count || 0,
    processing: (processingReports as any[])[0]?.count || 0,
    resolved: (resolvedReports as any[])[0]?.count || 0,
  };
};
