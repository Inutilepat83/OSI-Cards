const path = require('path');
const { AngularWebpackPlugin } = require('@angular-devkit/build-angular/src/webpack/plugins');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (config, options) => {
  // Production optimizations
  if (options.configuration === 'production') {
    
    // Enhanced minification
    config.optimization = {
      ...config.optimization,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
              passes: 2
            },
            mangle: {
              safari10: true,
              properties: {
                regex: /^_/
              }
            },
            format: {
              comments: false,
              ascii_only: true
            }
          },
          extractComments: false,
          parallel: true
        })
      ],
      
      // Enhanced code splitting
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // Vendor chunk for stable dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true
          },
          
          // Angular core chunk
          angular: {
            test: /[\\/]node_modules[\\/]@angular[\\/]/,
            name: 'angular',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true
          },
          
          // RxJS chunk
          rxjs: {
            test: /[\\/]node_modules[\\/]rxjs[\\/]/,
            name: 'rxjs',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true
          },
          
          // NgRx chunk
          ngrx: {
            test: /[\\/]node_modules[\\/]@ngrx[\\/]/,
            name: 'ngrx',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true
          },
          
          // Material Design chunk
          material: {
            test: /[\\/]node_modules[\\/]@angular[\\/]material[\\/]/,
            name: 'material',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true
          },
          
          // Common app modules
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Async chunks for lazy-loaded modules
          async: {
            chunks: 'async',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    };

    // Add compression plugins
    config.plugins.push(
      // Gzip compression
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      }),
      
      // Brotli compression
      new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: {
          level: 11,
        },
        threshold: 8192,
        minRatio: 0.8
      })
    );
  }

  // Development optimizations
  if (options.configuration === 'development') {
    
    // Enhanced development experience
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          }
        }
      }
    };

    // Development plugins
    config.plugins.push(
      // Bundle analyzer for development
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        analyzerHost: 'localhost',
        analyzerPort: 8888,
        openAnalyzer: false,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json'
      })
    );
  }

  // Module resolution optimizations
  config.resolve = {
    ...config.resolve,
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@core': path.resolve(__dirname, 'src/app/core'),
      '@shared': path.resolve(__dirname, 'src/app/shared'),
      '@features': path.resolve(__dirname, 'src/app/features'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@environments': path.resolve(__dirname, 'src/environments')
    },
    
    // Reduce resolve attempts
    modules: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules')
    ],
    
    // Optimize extensions
    extensions: ['.ts', '.js', '.json'],
    
    // Main fields for better tree shaking
    mainFields: ['es2020', 'es2015', 'module', 'main']
  };

  // Module rules optimizations
  config.module.rules = config.module.rules.map(rule => {
    if (rule.test && rule.test.toString().includes('ts')) {
      // TypeScript optimization
      if (rule.use && Array.isArray(rule.use)) {
        rule.use = rule.use.map(use => {
          if (use.loader && use.loader.includes('@angular-devkit/build-angular')) {
            return {
              ...use,
              options: {
                ...use.options,
                transpileOnly: options.configuration === 'development',
                experimentalDecorators: true,
                emitDecoratorMetadata: true
              }
            };
          }
          return use;
        });
      }
    }
    
    return rule;
  });

  // Performance optimization
  config.performance = {
    maxAssetSize: 512000,
    maxEntrypointSize: 512000,
    hints: options.configuration === 'production' ? 'warning' : false
  };

  // Cache configuration for faster builds
  config.cache = {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    },
    cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack')
  };

  // Source map optimization
  if (options.configuration === 'production') {
    config.devtool = 'source-map';
  } else {
    config.devtool = 'eval-cheap-module-source-map';
  }

  return config;
};
