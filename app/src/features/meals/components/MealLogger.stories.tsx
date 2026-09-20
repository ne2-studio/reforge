import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MealLogger } from './MealLogger';
import { MealLibraryItem } from '@/types';

const libraryItems = [
  new MealLibraryItem({
    id: 'library-1',
    title: 'Pollo con arroz',
    description: 'Pechuga de pollo a la plancha con arroz blanco',
    category: 'lunch',
    calories: 600,
    protein: 50,
    carbs: 60,
    fats: 15,
  }),
];

const meta = {
  title: 'Features/Meals/MealLogger',
  component: MealLogger,
  args: {
    isSaving: false,
    onSave: fn(),
    libraryItems: [],
    onSaveToLibrary: fn(),
    isAnalyzing: false,
    onAnalyze: fn(),
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

export const WithLibraryItems: Story = {
  args: {
    libraryItems,
  },
};

export const Analyzing: Story = {
  args: {
    isAnalyzing: true,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Analizar con IA' }));
  },
};
