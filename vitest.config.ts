import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Test configuration
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'test/fixtures/**'],
    
    // Coverage configuration
    coverage: {
      enabled: false, // Enable with --coverage flag
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'test/**',
        '*.config.ts',
        '*.config.js',
        'src/types/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      all: true,
      clean: true,
    },
    
    // Test timeout and retry configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 1000,
    retry: 0,
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    
    // Reporter configuration
    reporters: ['default'],
    outputFile: {
      json: './test-results.json',
      html: './test-results.html',
    },
    
    // Setup files
    setupFiles: ['./test/setup.ts'],
    
    // Type checking
    typecheck: {
      enabled: false, // Enable with --typecheck flag
      checker: 'tsc',
      include: ['**/*.test.ts', '**/*.spec.ts'],
    },
    
    // Watch mode configuration
    watch: false,
    watchExclude: ['**/node_modules/**', '**/dist/**', '.git/**'],
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
      },
    },
    maxConcurrency: 5,
    
    // Other options
    allowOnly: false,
    dangerouslyIgnoreUnhandledErrors: false,
    passWithNoTests: false,
    logHeapUsage: false,
    
    // Benchmark configuration (for performance tests)
    benchmark: {
      include: ['test/**/*.bench.ts'],
      exclude: ['node_modules'],
    },
  },
  
  // Resolve configuration for TypeScript and ES modules
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
    extensions: ['.ts', '.js', '.json'],
  },
  
  // ESBuild configuration for TypeScript
  esbuild: {
    target: 'node18',
  },
});