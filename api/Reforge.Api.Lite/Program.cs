using Reforge.Api.Common;
using Reforge.Infra.Lite;
using Serilog;

// Bootstrap logger: catches startup failures before configuration is available.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// The only infrastructure this image knows about: everything in-memory. No Postgres — see
// Reforge.Infra.Lite.ServiceRegistration.
builder.Services.AddLiteInfrastructure(builder.Configuration);

// Everything infra-agnostic (auth, CORS, Serilog, manager DI, middleware pipeline) is shared
// with reforge-api via Reforge.Api.Common — see ReforgeApiHost for what this does. Same
// compiled pipeline as the real image, just backed by different ports underneath.
var app = ReforgeApiHost.Build(builder);

app.Run();
