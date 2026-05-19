/**
 * Admin credentials — set via environment variables (see .env.example).
 * On Render: Dashboard → your static site → Environment → add VITE_ADMIN_USERNAME and VITE_ADMIN_PASSWORD.
 */
export const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "freethinkers2024";
