using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Data;

/// <summary>
/// Backfills missing <c>ImageUrl</c> values on restaurants and menu items with curated Unsplash imagery.
/// Idempotent: only writes rows where ImageUrl is currently null/empty.
/// (SRP: imagery backfill only — separate from user/demo seeding.)
/// </summary>
public static class ImageSeeder
{
    private const string U = "https://images.unsplash.com/";
    private const string Q = "?auto=format&fit=crop&w=800&q=70";
    private const string QSmall = "?auto=format&fit=crop&w=400&q=70";

    private static readonly Dictionary<int, string> RestaurantCovers = new()
    {
        // (id → unsplash photo URL — chosen to match the cuisine & evoke a real kitchen)
        [1] = $"{U}photo-1585937421612-70a008356fbe{Q}", // Indian thali
        [2] = $"{U}photo-1565299624946-b28f40a0ae38{Q}", // Pizza
        [3] = $"{U}photo-1579871494447-9811cf80d66c{Q}", // Sushi board
        [4] = $"{U}photo-1568901346375-23c9450c58cd{Q}", // Cheeseburger
        [5] = $"{U}photo-1546069901-ba9599a7e63c{Q}",   // Buddha bowl
        [6] = $"{U}photo-1563379091339-03b21ab4a4f8{Q}", // Chinese stir-fry
    };

    private static readonly Dictionary<int, string> MenuItemImages = new()
    {
        // Spice Garden
        [1] = $"{U}photo-1601050690597-df0568f70950{QSmall}", // Onion bhaji
        [2] = $"{U}photo-1601050690597-df0568f70950{QSmall}", // Samosa (same family)
        [3] = $"{U}photo-1565557623262-b51c2513a641{QSmall}", // Tikka masala
        [4] = $"{U}photo-1574484284002-952d92456975{QSmall}", // Lamb rogan josh
        [5] = $"{U}photo-1546833999-b9f581a1996d{QSmall}",    // Chana masala
        [6] = $"{U}photo-1596797038530-2c107229654b{QSmall}", // Pilau rice
        [7] = $"{U}photo-1626776876729-bab4369a5a5a{QSmall}", // Naan
        [8] = $"{U}photo-1626203051081-58f330784042{QSmall}", // Mango lassi

        // Bella Napoli
        [9]  = $"{U}photo-1572695157366-5e585ab2b69f{QSmall}", // Bruschetta
        [10] = $"{U}photo-1633436374961-09b92742047b{QSmall}", // Arancini
        [11] = $"{U}photo-1574071318508-1cdbab80d002{QSmall}", // Margherita
        [12] = $"{U}photo-1628840042765-356cda07504e{QSmall}", // Pepperoni
        [13] = $"{U}photo-1612874742237-6526221588e3{QSmall}", // Carbonara
        [14] = $"{U}photo-1573140247632-f8fd74997d5c{QSmall}", // Garlic bread
        [15] = $"{U}photo-1551248429-40975aa4de74{QSmall}",    // Caesar salad
        [16] = $"{U}photo-1543253687-c931c8e01820{QSmall}",    // Sparkling water

        // Sakura Sushi
        [17] = $"{U}photo-1623689043725-4f25fb47bc62{QSmall}", // Edamame
        [18] = $"{U}photo-1606851181064-0a1f4f4fec5f{QSmall}", // Miso soup
        [19] = $"{U}photo-1611143669185-af224c5e3252{QSmall}", // Sashimi
        [20] = $"{U}photo-1579871494447-9811cf80d66c{QSmall}", // Dragon roll
        [21] = $"{U}photo-1604908554007-d80abf398e98{QSmall}", // Katsu curry
        [22] = $"{U}photo-1536304993881-ff6e9eefa2a6{QSmall}", // Steamed rice
        [23] = $"{U}photo-1626804475297-41608ea09aeb{QSmall}", // Gyoza
        [24] = $"{U}photo-1556679343-c7306c1976bc{QSmall}",    // Green tea

        // The Burger Joint
        [25] = $"{U}photo-1608039755401-742074f0548d{QSmall}", // Buffalo wings
        [26] = $"{U}photo-1531749668029-2db88e4276c7{QSmall}", // Mozz sticks
        [27] = $"{U}photo-1568901346375-23c9450c58cd{QSmall}", // Cheeseburger
        [28] = $"{U}photo-1572802419224-296b0aeee0d9{QSmall}", // BBQ bacon burger
        [29] = $"{U}photo-1550317138-10000687a72b{QSmall}",    // Vegan burger
        [30] = $"{U}photo-1573080496219-bb080dd4f877{QSmall}", // Loaded fries
        [31] = $"{U}photo-1639024471283-03518883512d{QSmall}", // Onion rings
        [32] = $"{U}photo-1572490122747-3968b75cc699{QSmall}", // Chocolate milkshake

        // Green Bowl
        [33] = $"{U}photo-1571197119282-7c4a93cc1d83{QSmall}", // Hummus
        [34] = $"{U}photo-1603046891744-76e6300f82ef{QSmall}", // Avocado toast
        [35] = $"{U}photo-1546069901-ba9599a7e63c{QSmall}",    // Buddha bowl
    };

    public static async Task BackfillAsync(IServiceProvider services, ILogger logger)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FoodPlatformDbContext>();

        int restCount = 0;
        var restaurants = await db.Restaurants.ToListAsync();
        foreach (var r in restaurants)
        {
            if (!string.IsNullOrWhiteSpace(r.ImageUrl)) continue;
            if (RestaurantCovers.TryGetValue(r.Id, out var url))
            {
                r.ImageUrl = url;
                restCount++;
            }
        }

        int itemCount = 0;
        var items = await db.MenuItems.ToListAsync();
        foreach (var i in items)
        {
            if (!string.IsNullOrWhiteSpace(i.ImageUrl)) continue;
            if (MenuItemImages.TryGetValue(i.Id, out var url))
            {
                i.ImageUrl = url;
                itemCount++;
            }
        }

        if (restCount > 0 || itemCount > 0)
        {
            await db.SaveChangesAsync();
            logger.LogInformation("ImageSeeder: backfilled {Rest} restaurants and {Items} menu items with imagery.",
                restCount, itemCount);
        }
    }
}
