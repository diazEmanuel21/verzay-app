/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  images: {
    domains: ["medias3.verzay.co"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              'microphone=(self "https://verzay-web-verzay-ventas.2jcx9p.easypanel.host"), ' +
              'screen-wake-lock=(self "https://verzay-web-verzay-ventas.2jcx9p.easypanel.host")',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;