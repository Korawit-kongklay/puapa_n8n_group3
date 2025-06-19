import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from the builder.codes proxy domain
  allowedDevOrigins: [
    "46720e7cf2024aa1a340b7a51e9f6465-9150d9d5a28d4c2fb7de2a26e.projects.builder.codes",
  ],
};
