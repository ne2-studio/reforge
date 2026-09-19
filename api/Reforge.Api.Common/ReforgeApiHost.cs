using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Reforge.Core.Ping;
using Reforge.Core.Ping.Application;
using Reforge.Core.Shared;
using Reforge.Infra;
using Serilog;

namespace Reforge.Api.Common;

/// <summary>
/// Everything about the HTTP host that doesn't depend on which infrastructure is registered
/// behind the ports — auth, CORS, Serilog, Swagger, the application-layer manager wiring, and
/// the middleware pipeline. Shared between reforge-api (Program.cs) and reforge-api-lite
/// (Reforge.Api.Lite/Program.cs) so the two images run the exact same compiled pipeline and can
/// never silently diverge on it. Each caller registers its own infrastructure
/// (AddInfrastructure/AddLiteInfrastructure) on builder.Services *before* calling Build, and
/// handles its own infra-specific concerns (migrations for the real image) after it returns.
/// See docs/architecture/backend.md.
/// </summary>
public static class ReforgeApiHost
{
    public static WebApplication Build(WebApplicationBuilder builder)
    {
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();

        // Keeps every 400 in the one { "error": "..." } shape API-CONVENTIONS.md documents,
        // instead of letting ASP.NET's default [ApiController] model-binding failures fall
        // through to its own ValidationProblemDetails body.
        builder.Services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var message = context.ModelState.Values
                    .SelectMany(entry => entry.Errors)
                    .Select(error => error.ErrorMessage)
                    .FirstOrDefault(text => !string.IsNullOrEmpty(text))
                    ?? "The request was invalid.";

                return ErrorMapping.ToActionResult(ApplicationError.Validation(message));
            };
        });

        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Reforge API",
                Version = "v1",
                Description = "Reforge backend, following the Exeal backend architecture conventions."
            });
        });

        builder.Services.AddCors();

        // Reconfigure logging now that appsettings/environment config is available.
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .CreateLogger();

        builder.Host.UseSerilog();

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            // The backend reaches the OIDC provider over the internal Docker network, but the
            // token's "iss" claim — and every URL in the provider's discovery document,
            // jwks_uri included — is set to the address the *browser* used to sign in. Those
            // two addresses differ locally (fake-oidc:5000 vs localhost:5000), so instead of
            // letting JwtBearer follow the discovery document's (browser-facing, internally
            // unreachable) jwks_uri, signing keys are fetched directly from an
            // internally-reachable Auth:JwksUri, and the expected issuer is configured
            // independently as Auth:ValidIssuer. See docs/architecture/backend.md#auth.
            var jwksUri = builder.Configuration["Auth:JwksUri"]
                ?? throw new InvalidOperationException("Missing required configuration: Auth:JwksUri");

            JsonWebKeySet? cachedJwks = null;
            var jwksLock = new object();

            var validAudiences = builder.Configuration.GetSection("Auth:ValidAudiences").Get<string[]>()
                ?? throw new InvalidOperationException("Missing required configuration: Auth:ValidAudiences");

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidIssuer = builder.Configuration["Auth:ValidIssuer"],
                ValidAudiences = validAudiences,
                IssuerSigningKeyResolver = (_, _, _, _) =>
                {
                    lock (jwksLock)
                    {
                        cachedJwks ??= new JsonWebKeySet(new HttpClient().GetStringAsync(jwksUri).GetAwaiter().GetResult());
                    }
                    return cachedJwks.GetSigningKeys();
                }
            };
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<ReforgeApiHostLogCategory>>();
                    logger.LogWarning(context.Exception, "JWT authentication failed");
                    return Task.CompletedTask;
                }
            };
        });

        builder.Services.AddAuthorization();

        // Application-layer manager wiring — the walking skeleton's one feature.
        builder.Services.AddScoped<IPingUseCase, PingManager>();

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Reforge API v1"));
        }

        app.UseSerilogRequestLogging();

        app.UseRouting();

        // Acceptable since auth is bearer token, not cookies/origin-based.
        app.UseCors(policy => policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());

        app.UseAuthentication();
        app.UseMiddleware<UserSyncMiddleware>();
        app.UseAuthorization();

        app.MapControllers();

        return app;
    }
}

// ReforgeApiHost itself is static and can't be used as an ILogger<T> category — this is just a
// stable name for the log lines emitted from inside it.
file sealed class ReforgeApiHostLogCategory;
