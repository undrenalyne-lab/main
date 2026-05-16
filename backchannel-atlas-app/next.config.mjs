/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/france-money-map",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;
