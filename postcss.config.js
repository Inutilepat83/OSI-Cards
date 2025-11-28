module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Note: color-adjust warnings from node_modules/prismjs are informational
      // and can be safely ignored. The override CSS file (styles/prismjs-overrides.css)
      // handles the fix at runtime. The warning appears during build but doesn't affect functionality.
      // This is a known issue with prismjs using deprecated color-adjust property.
    },
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyFontValues: true,
          minifyParams: true
        }]
      }
    } : {})
  }
};
