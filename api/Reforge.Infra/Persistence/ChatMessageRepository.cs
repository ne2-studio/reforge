using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Chat.Domain;
using Reforge.Core.Chat.OutputPorts;

namespace Reforge.Infra.Persistence;

public class ChatMessageRepository(ReforgeDbContext dbContext) : IChatMessageRepository
{
    public Task<List<ChatMessage>> GetByUserIdAsync(UserId userId) =>
        dbContext.ChatMessages.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

    public async Task AddAsync(ChatMessage message)
    {
        dbContext.ChatMessages.Add(message);
        await dbContext.SaveChangesAsync();
    }
}
