import { Pool, QueryResult } from "pg";

const pool = new Pool({
  host: import.meta.env.VITE_DB_HOST || "localhost",
  port: parseInt(import.meta.env.VITE_DB_PORT || "5432"),
  user: import.meta.env.VITE_DB_USER || "postgres",
  password: import.meta.env.VITE_DB_PASSWORD || "",
  database: import.meta.env.VITE_DB_NAME || "kppu_reporting",
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export default pool;
