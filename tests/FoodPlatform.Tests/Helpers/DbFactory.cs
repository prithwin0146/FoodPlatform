using FoodPlatform.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Tests.Helpers;

/// <summary>
/// Provides a fresh, isolated EF Core InMemory database for each test.
/// (SRP: DB construction concern isolated from test logic)
/// </summary>
internal static class DbFactory
{
    /// <summary>
    /// Each call returns a brand-new InMemory database — tests never share state.
    /// </summary>
    internal static FoodPlatformDbContext Create() =>
        new(new DbContextOptionsBuilder<FoodPlatformDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(
                Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options);
}
