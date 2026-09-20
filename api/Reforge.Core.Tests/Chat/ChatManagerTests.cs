using Reforge.Domain;
using Reforge.Core.Chat;
using Reforge.Core.Chat.Application;
using Reforge.Core.Chat.Domain;
using Reforge.Core.Chat.OutputPorts;
using Reforge.Core.ClosedDays.Application;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Subscriptions.Application;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Tests.Fakes;
using Reforge.Infra.Lite;

namespace Reforge.Core.Tests.Chat;

// Orchestration only — system-prompt construction is exercised indirectly (via what gets
// recorded on FakeAiChatBackend.Calls), persistence and the "cerrar mi día" command handling are
// exercised directly. IClosedDaysUseCase is the real ClosedDaysManager (not a fake/stub) wired
// over the same fake repositories, per that interface's own doc comment: ChatManager is meant to
// call CloseDayAsync, not duplicate its logic, so these tests prove that delegation actually
// works rather than assuming it does.
public class ChatManagerTests
{
    private static readonly UserId UserId = new("auth0|chat-user");

    private static ChatManager CreateManager(
        FakeMealRepository? mealRepository = null,
        FakeProfileRepository? profileRepository = null,
        InMemoryChatMessageRepository? chatMessageRepository = null,
        FakeClosedDayRepository? closedDayRepository = null,
        FakeAiChatBackend? aiChatBackend = null,
        FakeFeatureFlags? featureFlags = null,
        FakeSubscriptionRepository? subscriptionRepository = null,
        FakeUsageRepository? usageRepository = null,
        DateTime? now = null,
        Guid? nextId = null)
    {
        var clock = new FakeClock(now ?? new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc));
        var closedDaysManager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            closedDayRepository ?? new FakeClosedDayRepository(),
            mealRepository ?? new FakeMealRepository(),
            new FakeWorkoutRepository(),
            new FakeActivityRepository(),
            profileRepository ?? new FakeProfileRepository(),
            clock,
            new FakeIdGenerator(Guid.NewGuid()));

        var subscriptionsManager = new SubscriptionsManager(
            new FakeCurrentUserProvider(UserId),
            subscriptionRepository ?? new FakeSubscriptionRepository(),
            new FakeCheckoutSessionRepository(),
            usageRepository ?? new FakeUsageRepository(),
            clock,
            new FakeIdGenerator(Guid.NewGuid()));

        // Slice 9: featureFlags defaults to off so every pre-existing test here keeps proving
        // today's unlimited behavior, unchanged. Usage-limit enforcement itself is covered by
        // SubscriptionsManagerTests and the dedicated tests at the bottom of this file.
        return new ChatManager(
            new FakeCurrentUserProvider(UserId),
            chatMessageRepository ?? new InMemoryChatMessageRepository(),
            mealRepository ?? new FakeMealRepository(),
            profileRepository ?? new FakeProfileRepository(),
            closedDaysManager,
            aiChatBackend ?? new FakeAiChatBackend(),
            featureFlags ?? new FakeFeatureFlags(),
            subscriptionsManager,
            clock,
            new FakeIdGenerator(nextId ?? Guid.NewGuid()));
    }

    [Fact]
    public async Task SendMessageAsync_ReturnsTheAiReply_AndPersistsTheTurn()
    {
        var chatMessageRepository = new InMemoryChatMessageRepository();
        var aiChatBackend = new FakeAiChatBackend { NextResult = Result.Success("¡Vas muy bien hoy!") };
        var id = Guid.NewGuid();
        var manager = CreateManager(chatMessageRepository: chatMessageRepository, aiChatBackend: aiChatBackend, nextId: id);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("¿Cómo voy hoy?"));

        Assert.True(result.IsSuccess);
        Assert.Equal("¡Vas muy bien hoy!", result.Value);

        var history = await chatMessageRepository.GetByUserIdAsync(UserId);
        var saved = Assert.Single(history);
        Assert.Equal(id, saved.Id);
        Assert.Equal("¿Cómo voy hoy?", saved.UserMessage);
        Assert.Equal("¡Vas muy bien hoy!", saved.AssistantMessage);

        var call = Assert.Single(aiChatBackend.Calls);
        Assert.Contains("Coach Recomp", call.SystemPrompt);
        Assert.Equal("¿Cómo voy hoy?", call.History[^1].Content);
        Assert.Equal("user", call.History[^1].Role);
    }

    [Fact]
    public async Task SendMessageAsync_SendsPriorHistoryInOrder_BeforeTheNewMessage()
    {
        var chatMessageRepository = new InMemoryChatMessageRepository();
        var earlier = new DateTime(2026, 3, 9, 8, 0, 0, DateTimeKind.Utc);
        await chatMessageRepository.AddAsync(new ChatMessage(Guid.NewGuid(), UserId, "Hola", "¡Hola! ¿Cómo estás?", earlier));
        var aiChatBackend = new FakeAiChatBackend();
        var manager = CreateManager(chatMessageRepository: chatMessageRepository, aiChatBackend: aiChatBackend);

        await manager.SendMessageAsync(new SendChatMessageRequestDto("¿Qué tal voy?"));

        var call = Assert.Single(aiChatBackend.Calls);
        Assert.Equal(3, call.History.Count);
        Assert.Equal(("user", "Hola"), (call.History[0].Role, call.History[0].Content));
        Assert.Equal(("assistant", "¡Hola! ¿Cómo estás?"), (call.History[1].Role, call.History[1].Content));
        Assert.Equal(("user", "¿Qué tal voy?"), (call.History[2].Role, call.History[2].Content));
    }

    [Fact]
    public async Task SendMessageAsync_PropagatesTheAiBackendsFailure_AndPersistsNothing()
    {
        var chatMessageRepository = new InMemoryChatMessageRepository();
        var aiChatBackend = new FakeAiChatBackend
        {
            NextResult = Result.Failure<string>(ApplicationError.ExternalDependencyUnavailable("Chat is not configured."))
        };
        var manager = CreateManager(chatMessageRepository: chatMessageRepository, aiChatBackend: aiChatBackend);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("Hola"));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.ExternalDependencyUnavailable, result.Error.Code);
        Assert.Empty(await chatMessageRepository.GetByUserIdAsync(UserId));
    }

    [Fact]
    public async Task SendMessageAsync_WhenTheAiRepliesTheCloseDayCommand_ClosesTodayAndReturnsASuccessMessage()
    {
        var mealRepository = new FakeMealRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
        mealRepository.Seed(new Meal(
            Guid.NewGuid(), UserId, "Chicken and rice", "lunch", "13:00", calories: 600, protein: 50, carbs: 60, fats: 15,
            timestamp: today, date: DateOnly.FromDateTime(today), createdAt: today));
        var aiChatBackend = new FakeAiChatBackend { NextResult = Result.Success("COMANDO_CERRAR_DIA") };
        var manager = CreateManager(mealRepository: mealRepository, aiChatBackend: aiChatBackend, now: today);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("cierra mi día"));

        Assert.True(result.IsSuccess);
        Assert.Contains("¡Día cerrado con éxito!", result.Value);
        Assert.Contains("600 calorías", result.Value);
        Assert.DoesNotContain("COMANDO_CERRAR_DIA", result.Value);
    }

    [Fact]
    public async Task SendMessageAsync_WhenTheAiRepliesTheCloseDayCommand_AndNoMealsAreLoggedToday_AsksForAMealFirst()
    {
        var aiChatBackend = new FakeAiChatBackend { NextResult = Result.Success("COMANDO_CERRAR_DIA") };
        var manager = CreateManager(aiChatBackend: aiChatBackend);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("cierra mi día"));

        Assert.True(result.IsSuccess);
        Assert.Contains("aún no tienes comidas registradas", result.Value);
    }

    [Fact]
    public async Task SendMessageAsync_WhenTheAiRepliesTheCloseDayCommand_AndTodayIsAlreadyClosed_ReturnsTheExistingAnalysis()
    {
        var mealRepository = new FakeMealRepository();
        var closedDayRepository = new FakeClosedDayRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
        var todayDate = DateOnly.FromDateTime(today);
        mealRepository.Seed(new Meal(
            Guid.NewGuid(), UserId, "Chicken and rice", "lunch", "13:00", calories: 600, protein: 50, carbs: 60, fats: 15,
            timestamp: today, date: todayDate, createdAt: today));
        closedDayRepository.Seed(new Reforge.Core.ClosedDays.Domain.ClosedDay(
            Guid.NewGuid(), UserId, todayDate, closedAt: today, totalCalories: 600, mealsCount: 1,
            isTrainingDay: false, analysis: "Ya cerrado previamente."));
        var aiChatBackend = new FakeAiChatBackend { NextResult = Result.Success("COMANDO_CERRAR_DIA") };
        var manager = CreateManager(
            mealRepository: mealRepository, closedDayRepository: closedDayRepository, aiChatBackend: aiChatBackend, now: today);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("cierra mi día"));

        Assert.True(result.IsSuccess);
        Assert.Contains("Tu día ya está cerrado", result.Value);
        Assert.Contains("Ya cerrado previamente.", result.Value);
    }

    [Fact]
    public async Task GetChatHistoryAsync_ReturnsOnlyTheCallersOwnMessages_OldestFirst()
    {
        var chatMessageRepository = new InMemoryChatMessageRepository();
        var otherUserId = new UserId("auth0|someone-else");
        var older = new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc);
        var newer = new DateTime(2026, 3, 5, 8, 0, 0, DateTimeKind.Utc);
        await chatMessageRepository.AddAsync(new ChatMessage(Guid.NewGuid(), UserId, "Hola", "¡Hola!", older));
        await chatMessageRepository.AddAsync(new ChatMessage(Guid.NewGuid(), UserId, "¿Qué tal voy?", "Vas bien", newer));
        await chatMessageRepository.AddAsync(new ChatMessage(Guid.NewGuid(), otherUserId, "Hola", "¡Hola!", older));
        var manager = CreateManager(chatMessageRepository: chatMessageRepository);

        var result = await manager.GetChatHistoryAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal(older, result.Value[0].Timestamp);
        Assert.Equal(newer, result.Value[1].Timestamp);
    }

    [Fact]
    public async Task SendMessageAsync_WhenSubscriptionsFlagIsOff_IsNeverLimited_RegardlessOfUsageCount()
    {
        var usageRepository = new FakeUsageRepository();
        usageRepository.Seed(UserId, UsageAction.ChatMessage, CurrentMonth(), count: 50);
        var manager = CreateManager(featureFlags: new FakeFeatureFlags(subscriptionsEnabled: false), usageRepository: usageRepository);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("Hola"));

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task SendMessageAsync_WhenSubscriptionsFlagIsOn_AndFreeTierUsageIsUnderTheLimit_SucceedsAndIncrementsUsage()
    {
        var usageRepository = new FakeUsageRepository();
        usageRepository.Seed(UserId, UsageAction.ChatMessage, CurrentMonth(), count: 9);
        var manager = CreateManager(featureFlags: new FakeFeatureFlags(subscriptionsEnabled: true), usageRepository: usageRepository);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("Hola"));

        Assert.True(result.IsSuccess);
        Assert.Equal(10, await usageRepository.GetCountAsync(UserId, UsageAction.ChatMessage, CurrentMonth()));
    }

    [Fact]
    public async Task SendMessageAsync_WhenSubscriptionsFlagIsOn_AndFreeTierUsageIsAtTheLimit_IsForbidden()
    {
        var chatMessageRepository = new InMemoryChatMessageRepository();
        var usageRepository = new FakeUsageRepository();
        usageRepository.Seed(UserId, UsageAction.ChatMessage, CurrentMonth(), count: 10);
        var manager = CreateManager(
            chatMessageRepository: chatMessageRepository,
            featureFlags: new FakeFeatureFlags(subscriptionsEnabled: true),
            usageRepository: usageRepository);

        var result = await manager.SendMessageAsync(new SendChatMessageRequestDto("Hola"));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Forbidden, result.Error.Code);
        Assert.Empty(await chatMessageRepository.GetByUserIdAsync(UserId));
    }

    private static DateOnly CurrentMonth()
    {
        var now = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
        return new DateOnly(now.Year, now.Month, 1);
    }
}
