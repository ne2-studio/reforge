import { Button } from '@/design-system/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/design-system/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import type { MealLibraryItem } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  'mid-morning': 'Media mañana',
  lunch: 'Comida',
  snack: 'Merienda',
  dinner: 'Cena',
};

const CATEGORY_ORDER = ['breakfast', 'mid-morning', 'lunch', 'snack', 'dinner'];

interface MealLibraryListProps {
  items: MealLibraryItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

function groupByCategory(items: MealLibraryItem[]): Map<string, MealLibraryItem[]> {
  const groups = new Map<string, MealLibraryItem[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  return groups;
}

// Presentational — no react-router-dom/store/useCases imports. Ported from
// reforge-frontend/src/components/MealLibrary.tsx's grouped-by-category list, adapted to
// Reforge's own lowercase category values (see types/index.ts's MealLibraryItem comment) and
// this design system's <AlertDialog> for the delete confirmation, instead of inventing a new
// confirm pattern.
export function MealLibraryList({ items, isLoading, onDelete }: MealLibraryListProps) {
  if (isLoading && items.length === 0) {
    return <p className="text-sm text-muted-foreground">Cargando biblioteca de comidas…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no has guardado ninguna comida en tu biblioteca.
      </p>
    );
  }

  const groups = groupByCategory(items);
  const categories = [...groups.keys()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-medium">{CATEGORY_LABELS[category] ?? category}</h3>
          <ul className="space-y-3">
            {groups.get(category)!.map((item) => (
              <li
                key={item.id}
                className="bg-card rounded-lg p-4 border-2 border-border flex items-start justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex gap-3 text-xs flex-wrap mt-1">
                    <span>{item.calories} kcal</span>
                    <span>{item.protein}g proteína</span>
                    <span>{item.carbs}g carbos</span>
                    <span>{item.fats}g grasas</span>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Eliminar ${item.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar de la biblioteca?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará &quot;{item.title}&quot; de tu biblioteca de comidas. Esta acción no se
                        puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(item.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
