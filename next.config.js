/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  images: {
    domains: ['medias3.verzay.co'], // Agrega tu dominio aquí
  },
};

module.exports = nextConfig;
