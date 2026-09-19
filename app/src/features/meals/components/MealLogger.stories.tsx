import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MealLogger } from './MealLogger';

const meta = {
  title: 'Features/Meals/MealLogger',
  component: MealLogger,
  args: {
    isSaving: false,
    onSave: fn(),
  },
} satisfies Meta<typeof MealLogger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Saving: Story = {
  args: {
    isSaving: true,
  },
};
