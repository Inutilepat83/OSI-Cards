import { defineConfig } from 'vite';
import ignoreDynamicImports from 'vite-plugin-ignore-dynamic-imports';

/**
 * Vite configuration for Angular application
 * 
 * Configures Vite to handle optional dependencies like html2pdf.js
 * that may not be installed or need special handling during import analysis
 */
export default defineConfig({
  plugins: [
    // Automatically add @vite-ignore to dynamic imports in our services
    ignoreDynamicImports({
      include: [
        '**/card-pdf-html2pdf.service.ts',
        '**/card-pdf.service.ts',
      ],
    }),
  ],
  optimizeDeps: {
    // Exclude optional dependencies from pre-bundling
    // This allows them to be loaded dynamically at runtime
    exclude: [
      'html2pdf.js', // Optional dependency - load dynamically
    ],
    // Include nested dependencies that html2pdf.js might need
    include: [
      'html2canvas', // html2pdf.js depends on html2canvas
      'jspdf', // html2pdf.js depends on jsPDF
    ],
  },
  build: {
    commonjsOptions: {
      // Ensure CommonJS modules in optional dependencies are handled
      include: [
        /html2pdf\.js/,
        /html2canvas/,
        /jspdf/,
        /node_modules/,
      ],
    },
  },
  ssr: {
    // Don't try to resolve these during SSR
    noExternal: [],
    external: ['html2pdf.js'],
  },
});
