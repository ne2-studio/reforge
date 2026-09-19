using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using Reforge.Api.Common;
using Reforge.Api.Common.Controllers;
using Reforge.Infra.Lite;
using Swashbuckle.AspNetCore.Swagger;

namespace Reforge.Api.Tests;

public class OpenApiContractSnapshotTests
{
    private const string UpdateSnapshotEnvironmentVariable = "UPDATE_OPENAPI_SNAPSHOT";

    [Fact]
    public async Task OpenApi_v1_matches_the_reviewed_contract_snapshot()
    {
        var snapshotPath = Path.Combine(RepositoryRoot(), "api", "openapi", "v1.swagger.json");
        var receivedPath = Path.Combine(RepositoryRoot(), "api", "openapi", "v1.swagger.received.json");
        var currentContract = await GenerateOpenApiJsonAsync();

        if (Environment.GetEnvironmentVariable(UpdateSnapshotEnvironmentVariable) == "1")
        {
            Directory.CreateDirectory(Path.GetDirectoryName(snapshotPath)!);
            await File.WriteAllTextAsync(snapshotPath, currentContract);
            File.Delete(receivedPath);
            return;
        }

        Assert.True(
            File.Exists(snapshotPath),
            $"Missing OpenAPI snapshot at {snapshotPath}. Run with {UpdateSnapshotEnvironmentVariable}=1 to create it after reviewing the generated contract.");

        var approvedContract = await File.ReadAllTextAsync(snapshotPath);
        if (approvedContract == currentContract)
        {
            File.Delete(receivedPath);
            return;
        }

        await File.WriteAllTextAsync(receivedPath, currentContract);
        Assert.Fail(
            $"OpenAPI contract changed. Review the diff between {snapshotPath} and {receivedPath}; " +
            "if intentional, run: ./scripts/openapi accept-contract; ./scripts/openapi generate-types; " +
            "./scripts/verify frontend.");
    }

    private static async Task<string> GenerateOpenApiJsonAsync()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Development"
        });

        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Auth:JwksUri"] = "http://localhost:5000/.well-known/jwks.json",
            ["Auth:ValidIssuer"] = "http://localhost:5000",
            ["Auth:ValidAudiences:0"] = "reforge-app"
        });
        builder.Services.AddLiteInfrastructure(builder.Configuration);
        builder.Services.AddControllers().AddApplicationPart(typeof(PingController).Assembly);

        await using var app = ReforgeApiHost.Build(builder);
        var swaggerProvider = app.Services.GetRequiredService<ISwaggerProvider>();
        var swagger = swaggerProvider.GetSwagger("v1");

        using var stringWriter = new StringWriter();
        var jsonWriter = new OpenApiJsonWriter(stringWriter);
        swagger.SerializeAsV3(jsonWriter);

        return stringWriter + Environment.NewLine;
    }

    private static string RepositoryRoot([CallerFilePath] string callerFilePath = "")
    {
        var directory = new DirectoryInfo(Path.GetDirectoryName(callerFilePath)!);

        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "docker-compose.yaml")))
            directory = directory.Parent;

        if (directory is null)
            throw new InvalidOperationException("Cannot locate repository root from test path.");

        return directory.FullName;
    }
}
