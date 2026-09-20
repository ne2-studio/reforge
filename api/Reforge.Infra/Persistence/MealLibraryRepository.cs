using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.MealLibrary.Domain;
using Reforge.Core.MealLibrary.OutputPorts;

namespace Reforge.Infra.Persistence;

public class MealLibraryRepository(ReforgeDbContext dbContext) : IMealLibraryRepository
{
    public Task<List<MealLibraryItem>> GetByUserIdAsync(UserId userId) =>
        dbContext.MealLibraryItems.AsNoTracking()
            .Where(m => m.UserId == userId)
            .ToListAsync();

    public async Task AddAsync(MealLibraryItem item)
    {
        dbContext.MealLibraryItems.Add(item);
        await dbContext.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(UserId userId, Guid id)
    {
        var item = await dbContext.MealLibraryItems
            .FirstOrDefaultAsync(m => m.UserId == userId && m.Id == id);
        if (item is null)
            return false;

        dbContext.MealLibraryItems.Remove(item);
        await dbContext.SaveChangesAsync();
        return true;
    }
}
