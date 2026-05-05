using FoodPlatform.Api.Infrastructure;
using Hangfire;

var builder = WebApplication.CreateBuilder(args);

// === Infrastructure (SRP: each concern owned by its own extension method) ===
builder.Services
    .AddDatabase(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddHangfireJobs(builder.Configuration)
    .AddApplicationServices()
    .AddApiCors()
    .AddControllers();

var app = builder.Build();

// === Middleware pipeline ===
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (app.Environment.IsDevelopment())
    app.UseHangfireDashboard("/hangfire");

app.Run();

