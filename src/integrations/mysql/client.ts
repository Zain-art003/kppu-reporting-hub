import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: import.meta.env.VITE_DB_HOST || "localhost",
  port: parseInt(import.meta.env.VITE_DB_PORT || "3306"),
  user: import.meta.env.VITE_DB_USER || "root",
  password: import.meta.env.VITE_DB_PASSWORD || "",
  database: import.meta.env.VITE_DB_NAME || "kppu_reporting",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const query = async (text: string, params?: any[]): Promise<any> => {
  const [rows] = await pool.execute(text, params);
  return rows;
};

export const getClient = async () => {
  return pool.getConnection();
};

export default pool;
