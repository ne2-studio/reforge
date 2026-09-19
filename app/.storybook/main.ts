import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  // The app's vite.config.ts (react() + tailwindcss()) is merged in automatically.
  async viteFinal(viteConfig) {
    return {
      ...viteConfig,
      build: {
        ...viteConfig.build,
        chunkSizeWarningLimit: 1300,
      },
    };
  },
};
export default config;
