import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Manually parser for .env
const envPath = path.resolve(process.cwd(), '../.env');
const envConfig: Record<string, string> = {};

try {
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        // Remove surrounding quotes if present
        if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        envConfig[key] = val;
        process.env[key] = val; // Also set it on process.env just in case
      }
    });
  }
} catch (error) {
  console.warn("Failed to load root .env file", error);
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPBOX_TOKEN: envConfig.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_API_URL: envConfig.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL,
  }
};

export default nextConfig;
