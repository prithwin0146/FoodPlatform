using System.Text;
using System.Threading.RateLimiting;
using FoodPlatform.Api.Data;
using FoodPlatform.Api.Services;
using FoodPlatform.Api.Services.Interfaces;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Resend;

namespace FoodPlatform.Api.Infrastructure;

/// <summary>
/// Groups DI registrations by concern. (SRP: each extension method owns one cross-cutting concern)
/// (OCP: add new extension methods here without touching Program.cs)
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<FoodPlatformDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));
        return services;
    }

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config["Jwt:Issuer"],
                    ValidAudience = config["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(config["Jwt:Key"]!))
                };
            });
        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddHangfireJobs(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddHangfire(cfg => cfg
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(config.GetConnectionString("DefaultConnection")));
        services.AddHangfireServer();
        return services;
    }

    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        // Auth (DIP: register interfaces, not concrete classes)
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();

        // Domain services
        services.AddScoped<IMenuService, MenuService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IRestaurantQueryService, RestaurantQueryService>();
        services.AddScoped<IAdminOrderService, AdminOrderService>();
        services.AddScoped<IAdminRestaurantService, AdminRestaurantService>();
        services.AddScoped<IAdminMenuService, AdminMenuService>();

        // Infrastructure services
        services.AddScoped<IStripeService, StripeService>();
        services.AddScoped<IEmailService, ResendEmailService>();

        return services;
    }

    /// <summary>
    /// Wires up the Resend email SDK.
    /// (SRP: email infrastructure registration isolated from everything else)
    /// </summary>
    public static IServiceCollection AddResendEmail(
        this IServiceCollection services, IConfiguration config)
    {
        services.Configure<ResendClientOptions>(options =>
        {
            options.ApiToken = config["Resend:ApiKey"] ?? string.Empty;
        });
        services.AddHttpClient<IResend, ResendClient>();
        return services;
    }

    public static IServiceCollection AddApiCors(
        this IServiceCollection services, IConfiguration config)
    {
        var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:4200"];

        services.AddCors(options =>
        {
            options.AddPolicy("AllowAngular", policy =>
                policy.WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials());
        });
        return services;
    }

    /// <summary>
    /// Applies a fixed-window rate limit to the "auth" policy (10 requests/min).
    /// (SRP: rate limiting concern owned here, not in controllers)
    /// </summary>
    public static IServiceCollection AddRateLimiting(
        this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("auth", cfg =>
            {
                cfg.Window = TimeSpan.FromMinutes(1);
                cfg.PermitLimit = 10;
                cfg.QueueLimit = 0;
                cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            });
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });
        return services;
    }
}
