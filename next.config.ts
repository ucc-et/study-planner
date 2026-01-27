import type { NextConfig } from "next";

function normalizeBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPagesBuild
  ? normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,

  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
