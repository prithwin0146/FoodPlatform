using FoodPlatform.Api.Data;
using FoodPlatform.Api.Hubs;
using FoodPlatform.Api.Infrastructure;
using Hangfire;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serilog;

// Bootstrap Serilog before the host so startup errors are captured.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// Serilog: replace default .NET logging; config driven by appsettings Serilog section.
builder.Host.UseSerilog((ctx, services, cfg) =>
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .ReadFrom.Services(services)
       .Enrich.FromLogContext()
       .Enrich.WithProperty("Application", "FoodPlatform.Api"));

// === Infrastructure (SRP: each concern owned by its own extension method) ===
builder.Services
    .AddDatabase(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddHangfireJobs(builder.Configuration)
    .AddApplicationServices()
    .AddAngelcam(builder.Configuration)
    .AddResendEmail(builder.Configuration)
    .AddApiCors(builder.Configuration)
    .AddRateLimiting()
    .AddApiHealthChecks(builder.Configuration)
    .AddMemoryCacheService()
    .AddControllers();

var app = builder.Build();

// Auto-apply pending EF Core migrations on startup so every deploy is schema-safe.
// Runs before any request is served; failures abort startup and surface in logs.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FoodPlatformDbContext>();
    await db.Database.MigrateAsync();
}

// === Production safety: production-only middleware ===
if (!app.Environment.IsDevelopment())
{
    // HSTS: 1-year max-age, include subdomains, allow preloading.
    app.UseHsts();

    // Global exception handler: returns RFC 7807 ProblemDetails, never leaks stack traces.
    app.UseExceptionHandler(exceptionApp =>
    {
        exceptionApp.Run(async context =>
        {
            var feature = context.Features.Get<IExceptionHandlerFeature>();
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(feature?.Error, "Unhandled exception on {Path}", context.Request.Path);

            var problem = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Title = "An unexpected error occurred",
                Status = StatusCodes.Status500InternalServerError,
                Detail = "Please retry. If the problem persists, contact support."
            };
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(problem);
        });
    });
}

app.UseHttpsRedirection();

// Structured request logging — logs method, path, status, elapsed time.
app.UseSerilogRequestLogging(opts =>
    opts.EnrichDiagnosticContext = (diagCtx, httpCtx) =>
    {
        diagCtx.Set("RequestHost", httpCtx.Request.Host.Value ?? string.Empty);
        diagCtx.Set("UserAgent", httpCtx.Request.Headers.UserAgent.ToString());
    });

// Correlation ID: stamp every request so logs can be correlated end-to-end.
app.Use(async (ctx, next) =>
{
    if (!ctx.Request.Headers.ContainsKey("X-Request-Id"))
        ctx.Request.Headers.Append("X-Request-Id", Guid.NewGuid().ToString("N")[..12]);
    ctx.Response.Headers.Append("X-Request-Id", ctx.Request.Headers["X-Request-Id"].ToString());
    await next();
});

// === Middleware pipeline ===
app.UseCors("AllowAngular");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
// Phase 4: SignalR hub — JWT read from ?access_token= query string for browser WebSocket clients
app.MapHub<OrderHub>("/hubs/orders");

// Health check endpoint — returns 200 when SQL Server is reachable, 503 otherwise.
app.MapHealthChecks("/healthz", new HealthCheckOptions
{
    ResponseWriter = async (ctx, report) =>
    {
        ctx.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description
            })
        });
        await ctx.Response.WriteAsync(result);
    }
});

// Runs in every environment — only backfills rows where ImageUrl is null/empty.
{
    var imgLogger = app.Services.GetRequiredService<ILogger<Program>>();
    await ImageSeeder.BackfillAsync(app.Services, imgLogger);
}

if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire");

    // Runtime seed of demo accounts \u2014 Development only, never in production.
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    await DevDataSeeder.SeedDevUsersAsync(app.Services, logger);
}

app.Run();


