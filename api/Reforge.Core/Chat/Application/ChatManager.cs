using System.Text.Json;
using Reforge.Core.Chat.Domain;
using Reforge.Core.Chat.OutputPorts;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Subscriptions;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Core.Chat.Application;

public class ChatManager(
    ICurrentUserProvider currentUserProvider,
    IChatMessageRepository chatMessageRepository,
    IMealRepository mealRepository,
    IProfileRepository profileRepository,
    IAiChatBackend aiChatBackend,
    IFeatureFlags featureFlags,
    ISubscriptionsUseCase subscriptionsUseCase,
    IClock clock,
    IIdGenerator idGenerator) : IChatUseCase
{
    // recentChats.slice(-20) in the source.
    private const int MaxHistoryTurns = 20;

    // recentMeals.slice(-10) in the source (after the 7-day/excluding-today filter).
    private const int MaxRecentMealsForContext = 10;

    public async Task<Result<string>> SendMessageAsync(SendChatMessageRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();

        // Slice 9: skip the usage-limit check entirely when the flag is off, rather than calling
        // a "always succeeds" no-op — today's unlimited behavior stays unchanged verbatim.
        if (featureFlags.SubscriptionsEnabled())
        {
            var limitCheck = await subscriptionsUseCase.CheckUsageLimitAsync(UsageAction.ChatMessage);
            if (limitCheck.IsFailure)
                return Result.Failure<string>(limitCheck.Error);
        }

        var now = clock.UtcNow();
        var today = DateOnly.FromDateTime(now);

        var profile = await profileRepository.GetByUserIdAsync(userId);
        var allMeals = await mealRepository.GetByUserIdAsync(userId); // most-recent-first
        var todaysMeals = allMeals.Where(m => m.Date == today).OrderBy(m => m.Timestamp).ToList();
        var todayCalories = todaysMeals.Sum(m => m.Calories);

        var sevenDaysAgo = now.AddDays(-7);
        // The source filters allMeals (its own getMeals is unordered here, effectively insertion
        // order) then takes the last 10. allMeals here is already most-recent-first, so taking
        // the first 10 after filtering is the same intent — the 10 most recent qualifying meals —
        // without depending on the source's incidental array order.
        var recentMeals = allMeals
            .Where(m => m.Timestamp > sevenDaysAgo && m.Date != today)
            .Take(MaxRecentMealsForContext)
            .ToList();

        var chatHistory = await chatMessageRepository.GetByUserIdAsync(userId); // oldest-first
        var recentChats = chatHistory.TakeLast(MaxHistoryTurns).ToList();

        var systemPrompt = BuildSystemPrompt(profile, today, todaysMeals, todayCalories, recentMeals);

        var history = new List<ChatTurn>();
        foreach (var turn in recentChats)
        {
            history.Add(new ChatTurn("user", turn.UserMessage));
            history.Add(new ChatTurn("assistant", turn.AssistantMessage));
        }
        history.Add(new ChatTurn("user", request.Message));

        var replyResult = await aiChatBackend.GetReplyAsync(systemPrompt, history);
        if (replyResult.IsFailure)
            return Result.Failure<string>(replyResult.Error);

        var reply = replyResult.Value;

        var chatMessage = new ChatMessage(idGenerator.NewId(), userId, request.Message, reply, now);
        await chatMessageRepository.AddAsync(chatMessage);

        // Only after the message actually succeeded and was persisted — never speculatively.
        if (featureFlags.SubscriptionsEnabled())
            await subscriptionsUseCase.RecordUsageAsync(UsageAction.ChatMessage);

        return Result.Success(reply);
    }

    public async Task<Result<List<ChatMessageDto>>> GetChatHistoryAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var messages = await chatMessageRepository.GetByUserIdAsync(userId);
        return Result.Success(messages.Select(ToDto).ToList());
    }

    // Translates recomp-coach-backend's routes/chat.ts system-prompt template into C#, keeping
    // every Spanish string literal verbatim (product copy, not a domain term to translate — see
    // this repo's language rule).
    private static string BuildSystemPrompt(
        UserProfile? profile,
        DateOnly today,
        List<Meal> todaysMeals,
        int todayCalories,
        List<Meal> recentMeals)
    {
        var daySection = $"🔄 DÍA EN CURSO\nComidas registradas hoy ({todaysMeals.Count}):\n{DescribeMeals(todaysMeals, "Ninguna comida registrada aún")}\n\nProgreso calórico de HOY: {todayCalories} cal consumidas";

        return $"""
            Eres un coach de recomposición corporal empático y práctico. Tu nombre es "Coach Recomp".

            FILOSOFÍA:
            - Alto en proteína (1.8-2.2g/kg de peso corporal)
            - Hidratos según nivel de entrenamiento
            - Grasas moderadas (0.8-1g/kg)
            - Enfoque flexible y sostenible, no restrictivo

            ESTILO:
            - Tono cercano, motivador y práctico
            - Traduce datos complejos en decisiones simples
            - Da reglas prácticas fáciles de seguir
            - Celebra los progresos pequeños

            CONTEXTO DEL USUARIO:
            Perfil: {DescribeProfile(profile)}

            📅 CONTEXTO DEL DÍA ACTUAL ({today:yyyy-MM-dd}):
            {daySection}

            Historial de comidas (últimos 7 días, excluyendo hoy):
            {DescribeMeals(recentMeals, "Sin comidas registradas")}

            INSTRUCCIONES:
            - Cuando te pregunten "¿cómo voy?", "¿qué tal voy?" o similar, analiza el CONTEXTO DEL DÍA ACTUAL
            - Cuando pregunten por la cena/comida siguiente, usa el menú sugerido del día
            - Sé proactivo: si ves poco progreso en el día, sugiere acciones

            Responde de manera conversacional y personalizada según el contexto del usuario.
            """;
    }

    private static string DescribeProfile(UserProfile? profile) => profile is null
        ? "No configurado aún"
        : JsonSerializer.Serialize(new
        {
            profile.Age,
            profile.Gender,
            profile.Height,
            profile.Weight,
            profile.ActivityLevel,
            profile.Goal,
            profile.TrainingDays,
            profile.TrainingType,
            profile.TrainingTime,
            profile.Restrictions,
            profile.CalorieTarget
        });

    private static string DescribeMeals(List<Meal> meals, string whenEmpty) => meals.Count == 0
        ? whenEmpty
        : JsonSerializer.Serialize(meals.Select(m => new
        {
            m.MealText,
            m.Category,
            m.Time,
            m.Calories,
            m.Protein,
            m.Carbs,
            m.Fats
        }));

    private static ChatMessageDto ToDto(ChatMessage message) => new(
        message.Id,
        message.UserMessage,
        message.AssistantMessage,
        message.Timestamp);
}
