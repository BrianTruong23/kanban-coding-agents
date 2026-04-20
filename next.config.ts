import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: Restrict dev origins to localhost only
  // Remove or comment out this line entirely for production builds
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['localhost:3000', 'localhost:3001', '127.0.0.1:3000'],
  }),
};

export default nextConfig;
