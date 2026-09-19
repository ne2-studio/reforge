using Microsoft.EntityFrameworkCore;
using Reforge.Api.Common;
using Reforge.Infra;
using Serilog;

// Bootstrap logger: catches startup failures before configuration is available.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// Register this image's own infrastructure: real Postgres-backed adapters.
builder.Services.AddInfrastructure(builder.Configuration);

// Everything infra-agnostic (auth, CORS, Serilog, manager DI, middleware pipeline) is shared
// with reforge-api-lite via Reforge.Api.Common — see ReforgeApiHost for what this does.
var app = ReforgeApiHost.Build(builder);

// Migrations apply automatically at startup, never a manual deploy step — see
// docs/architecture/backend.md#data-access.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ReforgeDbContext>();
    await dbContext.Database.MigrateAsync();
}

app.Run();
