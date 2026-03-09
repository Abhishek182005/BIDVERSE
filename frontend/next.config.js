const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: false,
    esmExternals: false,
  },
  transpilePackages: [
    "@chakra-ui/react",
    "@chakra-ui/next-js",
    "@chakra-ui/icons",
    "@emotion/react",
    "@emotion/styled",
    "@chakra-ui/system",
    "@chakra-ui/theme",
    "@chakra-ui/provider",
    "@chakra-ui/color-mode",
  ],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };
    // Force CJS resolution for @chakra-ui packages
    config.resolve.conditionNames = ["require", "node", "default"];
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

module.exports = nextConfig;
