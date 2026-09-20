using System.Text.Json;
using Reforge.Core.Chat.Domain;
using Reforge.Core.Chat.OutputPorts;
using Reforge.Core.ClosedDays;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Chat.Application;

public class ChatManager(
    ICurrentUserProvider currentUserProvider,
    IChatMessageRepository chatMessageRepository,
    IMealRepository mealRepository,
    IProfileRepository profileRepository,
    IClosedDaysUseCase closedDaysUseCase,
    IAiChatBackend aiChatBackend,
    IClock clock,
    IIdGenerator idGenerator) : IChatUseCase
{
    // Ports recomp-coach-backend's routes/chat.ts COMANDO_CERRAR_DIA sentinel verbatim — the
    // model is instructed (see BuildSystemPrompt) to reply with exactly this keyword, and nothing
    // else, when the user asks to close their day.
    private const string CloseDayCommand = "COMANDO_CERRAR_DIA";

    // recentChats.slice(-20) in the source.
    private const int MaxHistoryTurns = 20;

    // recentMeals.slice(-10) in the source (after the 7-day/excluding-today filter).
    private const int MaxRecentMealsForContext = 10;

    public async Task<Result<string>> SendMessageAsync(SendChatMessageRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();
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

        var dayHistory = await closedDaysUseCase.GetDayHistoryAsync();
        var closedToday = dayHistory.IsSuccess ? dayHistory.Value.FirstOrDefault(d => d.Date == today) : null;

        var chatHistory = await chatMessageRepository.GetByUserIdAsync(userId); // oldest-first
        var recentChats = chatHistory.TakeLast(MaxHistoryTurns).ToList();

        var systemPrompt = BuildSystemPrompt(profile, today, closedToday, todaysMeals, todayCalories, recentMeals);

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
        if (reply.Contains(CloseDayCommand))
            reply = await HandleCloseDayCommandAsync(todaysMeals, todayCalories, profile);

        var chatMessage = new ChatMessage(idGenerator.NewId(), userId, request.Message, reply, now);
        await chatMessageRepository.AddAsync(chatMessage);

        return Result.Success(reply);
    }

    public async Task<Result<List<ChatMessageDto>>> GetChatHistoryAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var messages = await chatMessageRepository.GetByUserIdAsync(userId);
        return Result.Success(messages.Select(ToDto).ToList());
    }

    // Ports recomp-coach-backend's routes/chat.ts auto-close-on-command branch, adapted to
    // IClosedDaysUseCase's Result-based failure semantics instead of try/catch: a successful
    // CloseDayAsync gives the "just closed" message; a failure could mean either "already
    // closed today" (look up the existing analysis) or "no meals logged today" (checked directly
    // here, same guard ClosedDaysManager itself applies, so the message can be specific without
    // inspecting the failure's ApplicationErrorCode/message text).
    private async Task<string> HandleCloseDayCommandAsync(List<Meal> todaysMeals, int todayCalories, UserProfile? profile)
    {
        if (todaysMeals.Count == 0)
        {
            return "Quiero cerrar tu día pero parece que aún no tienes comidas registradas. " +
                   "Registra al menos una comida antes de cerrar el día. 📝";
        }

        var closeResult = await closedDaysUseCase.CloseDayAsync();
        if (closeResult.IsSuccess)
        {
            return $"✅ ¡Día cerrado con éxito!\n\n{closeResult.Value.Analysis}\n\n" +
                   "¡Buen trabajo hoy! 💪 Mañana será otro gran día.";
        }

        var today = DateOnly.FromDateTime(clock.UtcNow());
        var dayHistory = await closedDaysUseCase.GetDayHistoryAsync();
        var existing = dayHistory.IsSuccess ? dayHistory.Value.FirstOrDefault(d => d.Date == today) : null;
        if (existing is not null)
            return $"✅ Tu día ya está cerrado. Aquí está el resumen:\n\n{existing.Analysis}";

        return "Hubo un problema al intentar cerrar tu día. Por favor, inténtalo desde el botón " +
               "de \"Cerrar día\" en la sección de Comidas.";
    }

    // Translates recomp-coach-backend's routes/chat.ts system-prompt template into C#, keeping
    // every Spanish string literal verbatim (product copy, not a domain term to translate — see
    // this repo's language rule).
    private static string BuildSystemPrompt(
        UserProfile? profile,
        DateOnly today,
        ClosedDayDto? closedToday,
        List<Meal> todaysMeals,
        int todayCalories,
        List<Meal> recentMeals)
    {
        var daySection = closedToday is not null
            ? $"✅ DÍA YA CERRADO\nAnálisis del día: {JsonSerializer.Serialize(closedToday)}"
            : $"🔄 DÍA EN CURSO\nComidas registradas hoy ({todaysMeals.Count}):\n{DescribeMeals(todaysMeals, "Ninguna comida registrada aún")}\n\nProgreso calórico de HOY: {todayCalories} cal consumidas";

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

            COMANDOS ESPECIALES:
            Si el usuario pide "cerrar mi día", "cierra el día", "analiza mi día" o similar:
            - Responde con: "COMANDO_CERRAR_DIA"
            - No añadas texto adicional, solo esa palabra clave

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
            - Si el día ya está cerrado, referencia el análisis existente

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
