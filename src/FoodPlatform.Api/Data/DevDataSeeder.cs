using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Data;

/// <summary>
/// Runtime seeder for Development-only demo accounts.
/// (SRP: this class exists ONLY so production never auto-creates known-password accounts.)
/// (DIP: depends on IPasswordHasher abstraction so the hash algorithm can change without rewriting seeds.)
/// </summary>
public static class DevDataSeeder
{
    public static async Task SeedDevUsersAsync(IServiceProvider services, ILogger logger)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FoodPlatformDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        const string devPassword = "Password123!";
        var hash = hasher.Hash(devPassword);
        var now = DateTime.UtcNow;

        var wanted = new List<User>
        {
            new() { Role = "Admin",    Username = "admin",       Email = "admin@foodplatform.co.uk",  PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
            new() { Role = "Customer", Username = "demo",        Email = "customer@example.com",      PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
            new() { RestaurantId = 1, Role = "Staff", Username = "spicegarden", Email = "staff@spicegarden.co.uk", PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
            new() { RestaurantId = 2, Role = "Staff", Username = "bellanapoli", Email = "staff@bellanapoli.co.uk", PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
            new() { RestaurantId = 3, Role = "Staff", Username = "sakurasushi", Email = "staff@sakurasushi.co.uk", PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
            new() { RestaurantId = 4, Role = "Staff", Username = "burgerjoint", Email = "staff@burgerjoint.co.uk", PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
            new() { RestaurantId = 5, Role = "Staff", Username = "greenbowl",   Email = "staff@greenbowl.co.uk",   PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
            new() { RestaurantId = 6, Role = "Staff", Username = "dragonwok",   Email = "staff@dragonwok.co.uk",   PasswordHash = hash, CreatedAt = now, IsEmailVerified = true },
        };

        // Per-account idempotency check (NOT "skip if any user exists"). The old logic
        // bailed out the moment a single real customer registered through the app, which
        // meant these demo admin/staff accounts silently never got created on a dev
        // database that already had real users in it — the actual cause of "can't log in
        // with admin/staff ids" locally.
        var existingEmails = await db.Users
            .Where(u => wanted.Select(w => w.Email).Contains(u.Email))
            .Select(u => u.Email)
            .ToListAsync();

        var missing = wanted.Where(u => !existingEmails.Contains(u.Email)).ToList();
        if (missing.Count == 0)
        {
            logger.LogInformation("DevDataSeeder: all demo accounts already present, skipping.");
            return;
        }

        db.Users.AddRange(missing);
        await db.SaveChangesAsync();
        logger.LogWarning("DevDataSeeder: inserted {Count} demo users with shared password '{Pwd}'. NEVER run in production.",
            missing.Count, devPassword);
    }
}
