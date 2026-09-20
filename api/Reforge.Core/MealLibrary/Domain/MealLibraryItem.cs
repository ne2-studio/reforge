using Reforge.Domain;

namespace Reforge.Core.MealLibrary.Domain;

// Slice 3 (docs/plan/02-vertical-slices.md): a user's reusable meal templates. Unlike Meal, this
// entity's shape is fully closed — no ExtraData JSON escape hatch — following the target
// LibraryMeal shape from the reforge-frontend reference (title/description/category/macros only,
// no name+extra_data grab-bag like the source backend's meal_library table). Id is a
// server-generated surrogate key, same as Meal.Id; UserId is a plain foreign-key-shaped field, a
// user has many library items.
public sealed class MealLibraryItem
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public string Title { get; }
    public string Description { get; }
    public string Category { get; }
    public int Calories { get; }
    public int Protein { get; }
    public int Carbs { get; }
    public int Fats { get; }

    public MealLibraryItem(
        Guid id,
        UserId userId,
        string title,
        string description,
        string category,
        int calories,
        int protein,
        int carbs,
        int fats)
    {
        Id = id;
        UserId = userId;
        Title = title;
        Description = description;
        Category = category;
        Calories = calories;
        Protein = protein;
        Carbs = carbs;
        Fats = fats;
    }
}
