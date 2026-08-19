using System.Text;
using System.Threading.RateLimiting;
using FoodPlatform.Api.Data;
using FoodPlatform.Api.Services;
using FoodPlatform.Api.Services.Interfaces;
using Hangfire;
using Microsoft.AspNetCore.DataProtection;
using Hangfire.PostgreSql;
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
            options.UseNpgsql(config.GetConnectionString("DefaultConnection"),
                npgsqlOptionsAction: sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorCodesToAdd: null);
                }));
        return services;
    }

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, IConfiguration config)
    {
        // Fail fast: a missing or weak JWT key must crash the app at boot,
        // not silently NRE on the first authenticated request.
        var key = config["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "Jwt:Key is not configured. Set the JWT_KEY environment variable.");
        if (key.Length < 32)
            throw new InvalidOperationException(
                "Jwt:Key must be at least 32 characters (256 bits) for HMAC-SHA256.");
        var issuer = config["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var audience = config["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
                // SignalR browsers cannot set the Authorization header during WebSocket/SSE upgrade.
                // Read the bearer token from the ?access_token= query string for /hubs/* paths.
                options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        var token = ctx.Request.Query["access_token"].ToString();
                        var path = ctx.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
                            ctx.Token = token;
                        return Task.CompletedTask;
                    }
                };
            });
        services.AddAuthorization();
        // SignalR in-process — no extra packages required for .NET 8
        services.AddSignalR();
        return services;
    }

    public static IServiceCollection AddHangfireJobs(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddHangfire(cfg => cfg
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(o => o.UseNpgsqlConnection(config.GetConnectionString("DefaultConnection")!)));
        services.AddHangfireServer();
        return services;
    }

    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        // ID encryption using ASP.NET Core Data Protection (AES-256-CBC + HMAC-SHA256)
        // Keys are persisted in PostgreSQL so they survive Render container restarts.
        services.AddDataProtection()
            .PersistKeysToDbContext<FoodPlatformDbContext>();
        services.AddSingleton<IUrlEncryptionService, UrlEncryptionService>();

        // Auth (DIP: register interfaces, not concrete classes)
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddHttpClient<IOAuthVerificationService, OAuthVerificationService>();

        // Domain services
        services.AddScoped<IMenuService, MenuService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IOrderPricingService, OrderPricingService>();
        services.AddScoped<IRestaurantQueryService, RestaurantQueryService>();
        services.AddScoped<IAdminOrderService, AdminOrderService>();
        services.AddScoped<IAdminRestaurantService, AdminRestaurantService>();
        services.AddScoped<IAdminMenuService, AdminMenuService>();
        services.AddScoped<IAdminUserService, AdminUserService>();

        // Analytics
        services.AddScoped<IAdminAnalyticsService, AdminAnalyticsService>();

        // Staff-facing restaurant service
        services.AddScoped<IRestaurantStaffService, RestaurantStaffService>();

        // Reviews
        services.AddScoped<IReviewService, ReviewService>();

        // Favourites
        services.AddScoped<IFavouritesService, FavouritesService>();

        // Phase 2: Promo codes, promotions, subscriptions, gift cards
        services.AddScoped<IPromoCodeService, PromoCodeService>();
        services.AddScoped<IRestaurantPromotionService, RestaurantPromotionService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IGiftCardService, GiftCardService>();
        services.AddScoped<IStripeWebhookHandlerService, StripeWebhookHandlerService>();

        // Phase 3: Inventory management + CSV bulk import
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IMenuImportService, MenuImportService>();

        // Platform settings (homepage video, etc.)
        services.AddScoped<IPlatformSettingsService, PlatformSettingsService>();

        // Infrastructure services
        services.AddScoped<IStripeService, StripeService>();
        services.AddScoped<IEmailService, ResendEmailService>();

        return services;
    }

    /// <summary>
    /// Registers the Angelcam typed HttpClient and service.
    /// (SRP: Angelcam wiring isolated here; callers get IAngelcamService via DI)
    /// Call this from Program.cs after loading configuration.
    /// </summary>
    public static IServiceCollection AddAngelcam(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddMemoryCache();
        var token = config["Angelcam:AccessToken"];
        // Use the interface-typed overload so DI resolves IAngelcamService through
        // the typed HttpClient factory — this guarantees the configured HttpClient
        // (with the Authorization header) is injected, not a plain default one.
        services.AddHttpClient<IAngelcamService, AngelcamService>(client =>
        {
            client.BaseAddress = new Uri("https://api.angelcam.com/");
            if (!string.IsNullOrWhiteSpace(token))
                client.DefaultRequestHeaders.Add("Authorization", $"PersonalAccessToken {token}");
        });
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

        // Defence-in-depth: refuse to start if a wildcard slipped into the allow-list.
        if (origins.Any(o => o.Contains('*')))
            throw new InvalidOperationException(
                "Cors:AllowedOrigins must not contain wildcards. Set explicit origins per environment.");

        services.AddCors(options =>
        {
            options.AddPolicy("AllowAngular", policy =>
                policy.WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    // SignalR requires AllowCredentials for the WebSocket upgrade handshake.
                    // Safe because we use an explicit allowlist (no wildcards) above.
                    .AllowCredentials());
        });
        return services;
    }

    /// <summary>
    /// Per-IP fixed-window rate limit on the "auth" policy (10 requests/min per remote IP).
    /// (SRP: rate limiting concern owned here, not in controllers)
    /// </summary>
    public static IServiceCollection AddRateLimiting(
        this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.AddPolicy("auth", httpContext =>
            {
                // Partition by remote IP so one attacker can't starve the whole server.
                // Falls back to "unknown" only if the connection has no remote address (test/loopback).
                var partitionKey =
                    httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    });
            });
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });
        return services;
    }

    /// <summary>
    /// Registers a health check endpoint that verifies SQL Server connectivity.
    /// (SRP: health-check wiring isolated here; controllers and services are unaware)
    /// </summary>
    public static IServiceCollection AddApiHealthChecks(
        this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        services.AddHealthChecks()
            .AddNpgSql(connectionString, name: "npgsql", tags: ["db", "ready"]);

        return services;
    }

    /// <summary>
    /// Registers the memory cache service for caching semi-static data.
    /// (SRP: caching concern isolated here; improves performance for read-heavy operations)
    /// </summary>
    public static IServiceCollection AddMemoryCacheService(
        this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddScoped<IMemoryCacheService, MemoryCacheService>();
        return services;
    }
}
