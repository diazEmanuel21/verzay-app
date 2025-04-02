/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Configuración para aumentar el límite de tamaño del body
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // o el tamaño que necesites
    },
  },
  
  // Configuración para aumentar el límite de análisis del body en API routes
  api: {
    bodyParser: {
      sizeLimit: '50mb' // o el tamaño que necesites
    }
  }
};

module.exports = nextConfig;