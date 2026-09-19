using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Reforge.Api.Common;
using Reforge.Api.Common.Controllers;
using Reforge.Infra.Lite;

namespace Reforge.Api.Tests;

/// <summary>
/// Reforge has no roles/admin surface (see docs/architecture/backend.md#auth) — the one auth
/// policy worth pinning down at this level is the walking skeleton's baseline: an authenticated
/// endpoint rejects an unauthenticated caller and accepts a validly-signed bearer token. Wires
/// the real ASP.NET pipeline (real DI, real JwtBearer options, real middleware order) via
/// ReforgeApiHost, same "needs the pipeline itself" reasoning as OpenApiContractSnapshotTests —
/// exercising a fake `Auth:JwksUri` endpoint hosted in-process (rather than a real fake-oidc
/// container) is enough to prove the policy without pulling in Testcontainers, which
/// api/acceptance-tests already covers end to end against a real OIDC provider.
/// </summary>
public class AuthPolicyTests
{
    private const string Issuer = "https://issuer.test";
    private const string Audience = "reforge-app";

    [Fact]
    public async Task GetPing_without_a_bearer_token_returns_401()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First());
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };

        var response = await client.GetAsync("/api/ping");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPing_with_a_validly_signed_bearer_token_returns_200()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First());
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateAccessToken(rsa, "reforge-user"));

        var response = await client.GetAsync("/api/ping");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private static WebApplication BuildApi(string jwksBaseAddress)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Production"
        });
        builder.WebHost.UseUrls("http://127.0.0.1:0");

        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Auth:JwksUri"] = $"{jwksBaseAddress}/.well-known/jwks.json",
            ["Auth:ValidIssuer"] = Issuer,
            ["Auth:ValidAudiences:0"] = Audience
        });
        builder.Services.AddLiteInfrastructure(builder.Configuration);
        builder.Services.AddControllers().AddApplicationPart(typeof(PingController).Assembly);

        return ReforgeApiHost.Build(builder);
    }

    /// <summary>A minimal in-process HTTP server standing in for fake-oidc's
    /// `/.well-known/jwks.json`, serving the public half of the same RSA key
    /// <see cref="CreateAccessToken"/> signs tokens with.</summary>
    private static async Task<WebApplication> StartFakeJwksHostAsync(RSA rsa)
    {
        var jwksBuilder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Production"
        });
        jwksBuilder.WebHost.UseUrls("http://127.0.0.1:0");
        var jwksJson = BuildJwksJson(rsa);

        var jwksHost = jwksBuilder.Build();
        jwksHost.MapGet("/.well-known/jwks.json", () => Results.Text(jwksJson, "application/json"));
        await jwksHost.StartAsync();
        return jwksHost;
    }

    private static string BuildJwksJson(RSA rsa)
    {
        var parameters = rsa.ExportParameters(includePrivateParameters: false);
        var jwk = new
        {
            kty = "RSA",
            use = "sig",
            kid = "test-key",
            alg = "RS256",
            n = Base64UrlEncoder.Encode(parameters.Modulus),
            e = Base64UrlEncoder.Encode(parameters.Exponent)
        };
        return JsonSerializer.Serialize(new { keys = new[] { jwk } });
    }

    private static string CreateAccessToken(RSA rsa, string sub)
    {
        var signingKey = new RsaSecurityKey(rsa) { KeyId = "test-key" };
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.RsaSha256);
        var handler = new JwtSecurityTokenHandler();
        var now = DateTime.UtcNow;

        return handler.CreateEncodedJwt(
            issuer: Issuer,
            audience: Audience,
            subject: new ClaimsIdentity([new Claim("sub", sub)]),
            notBefore: now,
            expires: now.AddMinutes(5),
            issuedAt: now,
            signingCredentials: credentials);
    }
}
