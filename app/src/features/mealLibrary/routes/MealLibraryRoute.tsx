import { useEffect } from 'react';
import { toast } from 'sonner';
import { useMealLibraryStore } from '@/store/mealLibraryStore';
import { loadLibrary, deleteFromLibrary } from '../useCases';
import { MealLibraryList } from '../components/MealLibraryList';

// Container for /biblioteca-comidas. Loads the caller's meal library on mount through the
// meal library store — see docs/architecture/frontend.md's `routes/` layer.
export function MealLibraryRoute() {
  const { items, isLoading, error } = useMealLibraryStore();

  useEffect(() => {
    void loadLibrary();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteFromLibrary(id);
      toast.success('Elemento eliminado de la biblioteca');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el elemento');
    }
  };

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <button className="underline" onClick={() => void loadLibrary()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Biblioteca de comidas</h1>
        <MealLibraryList items={items} isLoading={isLoading} onDelete={handleDelete} />
      </div>
    </div>
  );
}
