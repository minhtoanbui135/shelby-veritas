import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  disable: process.env.NODE_ENV === "development",
});

export default withPWA({
  distDir: "./dist",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  webpack: (config) => {
    // Polyfill Node.js modules not available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      got: false,
      "@telegram-apps/bridge": false,
    };
    return config;
  },
});
