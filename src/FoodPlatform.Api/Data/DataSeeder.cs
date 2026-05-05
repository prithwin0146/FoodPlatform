using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Data;

/// <summary>
/// Separates seed data from schema configuration. (SRP: seeding concern lives here, not in DbContext)
/// </summary>
public static class DataSeeder
{
    private static readonly DateTime SeedDate = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static void Seed(ModelBuilder modelBuilder)
    {
        SeedRestaurants(modelBuilder);
        SeedHours(modelBuilder);
        SeedMenus(modelBuilder);
        SeedUsers(modelBuilder);
    }

    private static void SeedRestaurants(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Restaurant>().HasData(
            new Restaurant { Id = 1, Name = "Spice Garden",     Address = "42 High Street, Westminster, London", BasePostcode = "SW1A 1AA", DeliveryRadiusMiles = 3.0, HygieneRating = 5, IsActive = true, CreatedAt = SeedDate },
            new Restaurant { Id = 2, Name = "Bella Napoli",     Address = "18 Soho Square, London",              BasePostcode = "W1D 3QL", DeliveryRadiusMiles = 2.5, HygieneRating = 5, IsActive = true, CreatedAt = SeedDate },
            new Restaurant { Id = 3, Name = "Sakura Sushi",     Address = "7 Shoreditch High Street, London",    BasePostcode = "E1 6JE",  DeliveryRadiusMiles = 4.0, HygieneRating = 5, IsActive = true, CreatedAt = SeedDate },
            new Restaurant { Id = 4, Name = "The Burger Joint", Address = "55 Camden High Street, London",       BasePostcode = "NW1 7JH", DeliveryRadiusMiles = 3.5, HygieneRating = 4, IsActive = true, CreatedAt = SeedDate },
            new Restaurant { Id = 5, Name = "Green Bowl",       Address = "12 Notting Hill Gate, London",        BasePostcode = "W11 3HR", DeliveryRadiusMiles = 3.0, HygieneRating = 5, IsActive = true, CreatedAt = SeedDate },
            new Restaurant { Id = 6, Name = "Dragon Wok",       Address = "88 Gerrard Street, Chinatown, London",BasePostcode = "W1D 5PT", DeliveryRadiusMiles = 2.5, HygieneRating = 4, IsActive = true, CreatedAt = SeedDate }
        );
    }

    private static void SeedHours(ModelBuilder modelBuilder)
    {
        // 7 days × 6 restaurants = 42 rows. IDs 1..42 grouped by restaurant.
        var hours = new List<RestaurantHours>();
        var schedules = new (int RestaurantId, int OpenH, int CloseH, int ClosedDay)[]
        {
            (1, 11, 23, 0),  // Spice Garden — closed Sunday
            (2, 12, 23, -1), // Bella Napoli — open every day
            (3, 12, 22, 1),  // Sakura Sushi — closed Monday
            (4, 11, 24, -1), // The Burger Joint — late night, every day
            (5,  9, 21, -1), // Green Bowl — early, every day
            (6, 12, 23, 2),  // Dragon Wok — closed Tuesday
        };
        int id = 1;
        foreach (var s in schedules)
        {
            for (int day = 0; day <= 6; day++)
            {
                hours.Add(new RestaurantHours
                {
                    Id = id++,
                    RestaurantId = s.RestaurantId,
                    DayOfWeek = day,
                    OpenTime = new TimeSpan(s.OpenH, 0, 0),
                    CloseTime = new TimeSpan(Math.Min(s.CloseH, 23), s.CloseH >= 24 ? 59 : 0, 0),
                    IsClosed = day == s.ClosedDay
                });
            }
        }
        modelBuilder.Entity<RestaurantHours>().HasData(hours);
    }

    private static void SeedMenus(ModelBuilder modelBuilder)
    {
        // 4 categories per restaurant × 6 restaurants = 24 categories. IDs 1..24, grouped by restaurant.
        var categories = new List<MenuCategory>();
        var categoryNames = new[] { "Starters", "Mains", "Sides", "Drinks" };
        int catId = 1;
        for (int r = 1; r <= 6; r++)
        {
            for (int i = 0; i < categoryNames.Length; i++)
            {
                categories.Add(new MenuCategory { Id = catId++, RestaurantId = r, Name = categoryNames[i], SortOrder = i });
            }
        }
        modelBuilder.Entity<MenuCategory>().HasData(categories);

        // Helper: category id for (restaurantId, slot 0..3)
        static int Cat(int r, int slot) => (r - 1) * 4 + slot + 1;

        var items = new List<MenuItem>
        {
            // ---- Spice Garden (R1) — Indian — items 1..8 ----
            new() { Id = 1,  RestaurantId = 1, CategoryId = Cat(1, 0), Name = "Onion Bhaji",          Description = "Crispy onion fritters",        Price = 4.50m,  Allergens = "[\"gluten\"]",       DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 2,  RestaurantId = 1, CategoryId = Cat(1, 0), Name = "Samosa",               Description = "Vegetable samosa (2 pieces)",  Price = 3.95m,  Allergens = "[\"gluten\"]",       DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 3,  RestaurantId = 1, CategoryId = Cat(1, 1), Name = "Chicken Tikka Masala", Description = "Creamy tomato-based curry",    Price = 11.95m, Allergens = "[\"milk\"]",                                                       CreatedAt = SeedDate },
            new() { Id = 4,  RestaurantId = 1, CategoryId = Cat(1, 1), Name = "Lamb Rogan Josh",      Description = "Slow-cooked lamb in rich sauce", Price = 13.50m,                                                                              CreatedAt = SeedDate },
            new() { Id = 5,  RestaurantId = 1, CategoryId = Cat(1, 1), Name = "Chana Masala",         Description = "Chickpea curry",               Price = 9.50m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
            new() { Id = 6,  RestaurantId = 1, CategoryId = Cat(1, 2), Name = "Pilau Rice",                                                          Price = 3.00m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
            new() { Id = 7,  RestaurantId = 1, CategoryId = Cat(1, 2), Name = "Garlic Naan",                                                         Price = 2.50m,  Allergens = "[\"gluten\",\"milk\"]",                                            CreatedAt = SeedDate },
            new() { Id = 8,  RestaurantId = 1, CategoryId = Cat(1, 3), Name = "Mango Lassi",                                                         Price = 3.50m,  Allergens = "[\"milk\"]",                                                       CreatedAt = SeedDate },

            // ---- Bella Napoli (R2) — Italian — items 9..16 ----
            new() { Id = 9,  RestaurantId = 2, CategoryId = Cat(2, 0), Name = "Bruschetta",           Description = "Toasted bread, tomato, basil", Price = 5.50m,  Allergens = "[\"gluten\"]",       DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 10, RestaurantId = 2, CategoryId = Cat(2, 0), Name = "Arancini",             Description = "Fried risotto balls (3)",      Price = 6.50m,  Allergens = "[\"gluten\",\"milk\"]",                                            CreatedAt = SeedDate },
            new() { Id = 11, RestaurantId = 2, CategoryId = Cat(2, 1), Name = "Margherita Pizza",     Description = "Tomato, mozzarella, basil",    Price = 10.95m, Allergens = "[\"gluten\",\"milk\"]", DietaryTags = "[\"vegetarian\"]",            CreatedAt = SeedDate },
            new() { Id = 12, RestaurantId = 2, CategoryId = Cat(2, 1), Name = "Pepperoni Pizza",      Description = "Spicy pepperoni, mozzarella",  Price = 12.95m, Allergens = "[\"gluten\",\"milk\"]",                                            CreatedAt = SeedDate },
            new() { Id = 13, RestaurantId = 2, CategoryId = Cat(2, 1), Name = "Spaghetti Carbonara",  Description = "Egg, pancetta, pecorino",      Price = 12.50m, Allergens = "[\"gluten\",\"milk\",\"egg\"]",                                    CreatedAt = SeedDate },
            new() { Id = 14, RestaurantId = 2, CategoryId = Cat(2, 2), Name = "Garlic Bread",                                                        Price = 4.00m,  Allergens = "[\"gluten\",\"milk\"]",                                            CreatedAt = SeedDate },
            new() { Id = 15, RestaurantId = 2, CategoryId = Cat(2, 2), Name = "Caesar Salad",                                                        Price = 7.50m,  Allergens = "[\"egg\",\"fish\",\"milk\"]",                                      CreatedAt = SeedDate },
            new() { Id = 16, RestaurantId = 2, CategoryId = Cat(2, 3), Name = "San Pellegrino",                                                      Price = 2.95m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },

            // ---- Sakura Sushi (R3) — Japanese — items 17..24 ----
            new() { Id = 17, RestaurantId = 3, CategoryId = Cat(3, 0), Name = "Edamame",              Description = "Steamed soy beans, sea salt",  Price = 4.25m,  Allergens = "[\"soy\"]",          DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
            new() { Id = 18, RestaurantId = 3, CategoryId = Cat(3, 0), Name = "Miso Soup",            Description = "Tofu, wakame, spring onion",   Price = 3.50m,  Allergens = "[\"soy\"]",          DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 19, RestaurantId = 3, CategoryId = Cat(3, 1), Name = "Salmon Sashimi (8pc)", Description = "Fresh sliced salmon",          Price = 14.50m, Allergens = "[\"fish\"]",          DietaryTags = "[\"gluten-free\"]",          CreatedAt = SeedDate },
            new() { Id = 20, RestaurantId = 3, CategoryId = Cat(3, 1), Name = "Dragon Roll",          Description = "Eel, avocado, cucumber",       Price = 13.95m, Allergens = "[\"fish\",\"soy\",\"sesame\"]",                                    CreatedAt = SeedDate },
            new() { Id = 21, RestaurantId = 3, CategoryId = Cat(3, 1), Name = "Chicken Katsu Curry",  Description = "Crispy chicken, Japanese curry", Price = 11.95m, Allergens = "[\"gluten\",\"egg\"]",                                          CreatedAt = SeedDate },
            new() { Id = 22, RestaurantId = 3, CategoryId = Cat(3, 2), Name = "Steamed Rice",                                                        Price = 2.50m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
            new() { Id = 23, RestaurantId = 3, CategoryId = Cat(3, 2), Name = "Gyoza (5pc)",          Description = "Pork dumplings",               Price = 5.95m,  Allergens = "[\"gluten\",\"soy\"]",                                             CreatedAt = SeedDate },
            new() { Id = 24, RestaurantId = 3, CategoryId = Cat(3, 3), Name = "Green Tea",                                                           Price = 2.25m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },

            // ---- The Burger Joint (R4) — American — items 25..32 ----
            new() { Id = 25, RestaurantId = 4, CategoryId = Cat(4, 0), Name = "Buffalo Wings (6)",    Description = "Spicy chicken wings, blue cheese", Price = 6.95m, Allergens = "[\"milk\"]",                                                  CreatedAt = SeedDate },
            new() { Id = 26, RestaurantId = 4, CategoryId = Cat(4, 0), Name = "Mozzarella Sticks",                                                   Price = 5.50m,  Allergens = "[\"gluten\",\"milk\"]", DietaryTags = "[\"vegetarian\"]",            CreatedAt = SeedDate },
            new() { Id = 27, RestaurantId = 4, CategoryId = Cat(4, 1), Name = "Classic Cheeseburger", Description = "Beef, cheddar, lettuce, pickle", Price = 9.95m,  Allergens = "[\"gluten\",\"milk\"]",                                          CreatedAt = SeedDate },
            new() { Id = 28, RestaurantId = 4, CategoryId = Cat(4, 1), Name = "BBQ Bacon Burger",     Description = "Beef, bacon, BBQ, onion ring", Price = 11.50m, Allergens = "[\"gluten\",\"milk\"]",                                            CreatedAt = SeedDate },
            new() { Id = 29, RestaurantId = 4, CategoryId = Cat(4, 1), Name = "Beyond Vegan Burger",  Description = "Plant patty, vegan cheese",    Price = 10.95m, Allergens = "[\"gluten\",\"soy\"]",   DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 30, RestaurantId = 4, CategoryId = Cat(4, 2), Name = "Loaded Fries",         Description = "Cheese, bacon, jalapeños",     Price = 5.50m,  Allergens = "[\"milk\"]",                                                       CreatedAt = SeedDate },
            new() { Id = 31, RestaurantId = 4, CategoryId = Cat(4, 2), Name = "Onion Rings",                                                         Price = 3.95m,  Allergens = "[\"gluten\"]",       DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 32, RestaurantId = 4, CategoryId = Cat(4, 3), Name = "Chocolate Milkshake",                                                 Price = 4.50m,  Allergens = "[\"milk\"]",                                                       CreatedAt = SeedDate },

            // ---- Green Bowl (R5) — Healthy/Vegan — items 33..40 ----
            new() { Id = 33, RestaurantId = 5, CategoryId = Cat(5, 0), Name = "Hummus & Pita",        Description = "Chickpea hummus, warm pita",   Price = 4.95m,  Allergens = "[\"gluten\",\"sesame\"]", DietaryTags = "[\"vegan\"]",               CreatedAt = SeedDate },
            new() { Id = 34, RestaurantId = 5, CategoryId = Cat(5, 0), Name = "Avocado Toast",        Description = "Sourdough, avo, chilli flakes", Price = 6.50m, Allergens = "[\"gluten\"]",       DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 35, RestaurantId = 5, CategoryId = Cat(5, 1), Name = "Quinoa Buddha Bowl",   Description = "Quinoa, kale, beetroot, tahini", Price = 10.95m, Allergens = "[\"sesame\"]",     DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
            new() { Id = 36, RestaurantId = 5, CategoryId = Cat(5, 1), Name = "Grilled Salmon Bowl",  Description = "Salmon, brown rice, edamame",  Price = 13.50m, Allergens = "[\"fish\",\"soy\"]", DietaryTags = "[\"gluten-free\"]",          CreatedAt = SeedDate },
            new() { Id = 37, RestaurantId = 5, CategoryId = Cat(5, 1), Name = "Falafel Wrap",         Description = "Falafel, salad, tahini wrap",  Price = 8.95m,  Allergens = "[\"gluten\",\"sesame\"]", DietaryTags = "[\"vegan\"]",               CreatedAt = SeedDate },
            new() { Id = 38, RestaurantId = 5, CategoryId = Cat(5, 2), Name = "Sweet Potato Fries",                                                  Price = 4.25m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
            new() { Id = 39, RestaurantId = 5, CategoryId = Cat(5, 2), Name = "Side Salad",                                                          Price = 3.50m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
            new() { Id = 40, RestaurantId = 5, CategoryId = Cat(5, 3), Name = "Cold-Pressed Juice",   Description = "Apple, ginger, lemon",         Price = 4.95m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },

            // ---- Dragon Wok (R6) — Chinese — items 41..48 ----
            new() { Id = 41, RestaurantId = 6, CategoryId = Cat(6, 0), Name = "Spring Rolls (4)",     Description = "Vegetable spring rolls",       Price = 4.50m,  Allergens = "[\"gluten\",\"soy\"]", DietaryTags = "[\"vegan\"]",                CreatedAt = SeedDate },
            new() { Id = 42, RestaurantId = 6, CategoryId = Cat(6, 0), Name = "Crispy Duck Pancakes", Description = "Quarter duck, pancakes, hoisin", Price = 12.95m, Allergens = "[\"gluten\",\"soy\",\"sesame\"]",                                CreatedAt = SeedDate },
            new() { Id = 43, RestaurantId = 6, CategoryId = Cat(6, 1), Name = "Sweet & Sour Chicken", Description = "Battered chicken, peppers",    Price = 9.95m,  Allergens = "[\"gluten\",\"egg\"]",                                             CreatedAt = SeedDate },
            new() { Id = 44, RestaurantId = 6, CategoryId = Cat(6, 1), Name = "Kung Pao Beef",        Description = "Beef, peanuts, Szechuan",      Price = 11.50m, Allergens = "[\"peanut\",\"soy\",\"gluten\"]",                                  CreatedAt = SeedDate },
            new() { Id = 45, RestaurantId = 6, CategoryId = Cat(6, 1), Name = "Mapo Tofu",            Description = "Soft tofu, chilli bean sauce", Price = 9.50m,  Allergens = "[\"soy\",\"gluten\"]", DietaryTags = "[\"vegetarian\"]",            CreatedAt = SeedDate },
            new() { Id = 46, RestaurantId = 6, CategoryId = Cat(6, 2), Name = "Egg Fried Rice",                                                      Price = 3.50m,  Allergens = "[\"egg\",\"soy\"]",                                                CreatedAt = SeedDate },
            new() { Id = 47, RestaurantId = 6, CategoryId = Cat(6, 2), Name = "Singapore Noodles",    Description = "Curry vermicelli noodles",     Price = 8.95m,  Allergens = "[\"egg\",\"soy\",\"shellfish\"]",                                  CreatedAt = SeedDate },
            new() { Id = 48, RestaurantId = 6, CategoryId = Cat(6, 3), Name = "Jasmine Tea",                                                         Price = 2.00m,                                    DietaryTags = "[\"vegan\",\"gluten-free\"]",CreatedAt = SeedDate },
        };
        modelBuilder.Entity<MenuItem>().HasData(items);
    }

    private static void SeedUsers(ModelBuilder modelBuilder)
    {
        // Password for all seed accounts: "Password123!"
        const string hash = "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim";
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Role = "Admin",    Username = "admin",       Email = "admin@foodplatform.co.uk",    PasswordHash = hash, CreatedAt = SeedDate },
            new User { Id = 2, RestaurantId = 1, Role = "Staff", Username = "spicegarden", Email = "staff@spicegarden.co.uk",   PasswordHash = hash, CreatedAt = SeedDate },
            new User { Id = 3, Role = "Customer", Username = "demo",        Email = "customer@example.com",         PasswordHash = hash, CreatedAt = SeedDate },
            new User { Id = 4, RestaurantId = 2, Role = "Staff", Username = "bellanapoli", Email = "staff@bellanapoli.co.uk",   PasswordHash = hash, CreatedAt = SeedDate },
            new User { Id = 5, RestaurantId = 3, Role = "Staff", Username = "sakurasushi", Email = "staff@sakurasushi.co.uk",   PasswordHash = hash, CreatedAt = SeedDate },
            new User { Id = 6, RestaurantId = 4, Role = "Staff", Username = "burgerjoint", Email = "staff@burgerjoint.co.uk",   PasswordHash = hash, CreatedAt = SeedDate },
            new User { Id = 7, RestaurantId = 5, Role = "Staff", Username = "greenbowl",   Email = "staff@greenbowl.co.uk",     PasswordHash = hash, CreatedAt = SeedDate },
            new User { Id = 8, RestaurantId = 6, Role = "Staff", Username = "dragonwok",   Email = "staff@dragonwok.co.uk",     PasswordHash = hash, CreatedAt = SeedDate }
        );
    }
}
