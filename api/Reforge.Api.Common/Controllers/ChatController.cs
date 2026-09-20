using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Chat;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 8 (docs/plan/02-vertical-slices.md): the AI coach chat. Routed as POST /api/chat and
/// GET /api/chat-history. The caller's identity is never a controller parameter; IChatUseCase
/// resolves it itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class ChatController(IChatUseCase chatUseCase) : ControllerBase
{
    [HttpPost("chat")]
    [ProducesResponseType(typeof(SendChatMessageResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostChat([FromBody] SendChatMessageRequestDto request)
    {
        var result = await chatUseCase.SendMessageAsync(request);
        return result.Map(reply => new SendChatMessageResponseDto(reply)).ToActionResult();
    }

    [HttpGet("chat-history")]
    [ProducesResponseType(typeof(List<ChatMessageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChatHistory()
    {
        var result = await chatUseCase.GetChatHistoryAsync();
        return result.ToActionResult();
    }
}
