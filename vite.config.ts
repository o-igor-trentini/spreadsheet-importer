import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => {
  const isLib = mode === 'production'

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isLib
        ? [
            dts({
              include: ['src'],
              rollupTypes: true,
              tsconfigPath: './tsconfig.app.json',
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@ui': resolve(__dirname, 'src/components/ui'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index',
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
      },
    },
  }
})
