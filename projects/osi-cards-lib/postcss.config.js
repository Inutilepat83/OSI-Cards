/**
 * PostCSS Configuration for OSI Cards Library
 * 
 * Processes CSS for:
 * - Autoprefixer: Cross-browser compatibility
 * - cssnano: Production minification
 * - postcss-custom-properties: CSS variable fallbacks
 */

module.exports = {
  plugins: [
    // Autoprefixer for cross-browser support
    require('autoprefixer')({
      // Support last 2 versions of major browsers
      overrideBrowserslist: [
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Safari versions',
        'last 2 Edge versions',
        'last 2 iOS versions',
        'last 2 Android versions'
      ],
      // Enable grid prefixes for IE11 support if needed
      grid: 'autoplace'
    }),

    // CSS variable fallbacks for older browsers
    require('postcss-custom-properties')({
      preserve: true, // Keep CSS variables in output
      warnings: false
    }),

    // Minification for production (only in production mode)
    ...(process.env.NODE_ENV === 'production' ? [
      require('cssnano')({
        preset: ['default', {
          // Don't remove CSS comments starting with /*! (license headers)
          discardComments: {
            removeAll: false,
            remove: (comment) => !comment.startsWith('!')
          },
          // Keep @keyframes names intact (they might be referenced in JS)
          reduceIdents: false,
          // Keep z-index values intact
          zindex: false,
          // Preserve CSS custom properties
          colormin: false,
          // Don't merge rules aggressively (can break specificity)
          mergeRules: false
        }]
      })
    ] : []),

    // Add CSS layer fallback for older browsers
    {
      postcssPlugin: 'postcss-layer-fallback',
      Once(root) {
        // Add a comment indicating layer support
        root.prepend({
          text: ' CSS Layers are used. If your browser doesn\'t support @layer, styles may not cascade correctly. '
        });
      }
    }
  ]
};










