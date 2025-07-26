import dotenv from "dotenv";

// Load environment variables from .env file
// This must be called before any other modules that use process.env
dotenv.config();

// Re-export dotenv for convenience
export { dotenv }; 