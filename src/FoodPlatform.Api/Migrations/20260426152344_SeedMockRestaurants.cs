using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedMockRestaurants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Restaurants",
                columns: new[] { "Id", "Address", "BasePostcode", "CreatedAt", "DeliveryRadiusMiles", "HygieneRating", "IsActive", "Name", "StripeAccountId" },
                values: new object[,]
                {
                    { 2, "18 Soho Square, London", "W1D 3QL", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2.5, 5, true, "Bella Napoli", null },
                    { 3, "7 Shoreditch High Street, London", "E1 6JE", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 4.0, 5, true, "Sakura Sushi", null },
                    { 4, "55 Camden High Street, London", "NW1 7JH", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3.5, 4, true, "The Burger Joint", null },
                    { 5, "12 Notting Hill Gate, London", "W11 3HR", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3.0, 5, true, "Green Bowl", null },
                    { 6, "88 Gerrard Street, Chinatown, London", "W1D 5PT", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2.5, 4, true, "Dragon Wok", null }
                });

            migrationBuilder.InsertData(
                table: "MenuCategories",
                columns: new[] { "Id", "Name", "RestaurantId", "SortOrder" },
                values: new object[,]
                {
                    { 5, "Starters", 2, 0 },
                    { 6, "Mains", 2, 1 },
                    { 7, "Sides", 2, 2 },
                    { 8, "Drinks", 2, 3 },
                    { 9, "Starters", 3, 0 },
                    { 10, "Mains", 3, 1 },
                    { 11, "Sides", 3, 2 },
                    { 12, "Drinks", 3, 3 },
                    { 13, "Starters", 4, 0 },
                    { 14, "Mains", 4, 1 },
                    { 15, "Sides", 4, 2 },
                    { 16, "Drinks", 4, 3 },
                    { 17, "Starters", 5, 0 },
                    { 18, "Mains", 5, 1 },
                    { 19, "Sides", 5, 2 },
                    { 20, "Drinks", 5, 3 },
                    { 21, "Starters", 6, 0 },
                    { 22, "Mains", 6, 1 },
                    { 23, "Sides", 6, 2 },
                    { 24, "Drinks", 6, 3 }
                });

            migrationBuilder.InsertData(
                table: "RestaurantHours",
                columns: new[] { "Id", "CloseTime", "DayOfWeek", "IsClosed", "OpenTime", "RestaurantId" },
                values: new object[,]
                {
                    { 8, new TimeSpan(0, 23, 0, 0, 0), 0, false, new TimeSpan(0, 12, 0, 0, 0), 2 },
                    { 9, new TimeSpan(0, 23, 0, 0, 0), 1, false, new TimeSpan(0, 12, 0, 0, 0), 2 },
                    { 10, new TimeSpan(0, 23, 0, 0, 0), 2, false, new TimeSpan(0, 12, 0, 0, 0), 2 },
                    { 11, new TimeSpan(0, 23, 0, 0, 0), 3, false, new TimeSpan(0, 12, 0, 0, 0), 2 },
                    { 12, new TimeSpan(0, 23, 0, 0, 0), 4, false, new TimeSpan(0, 12, 0, 0, 0), 2 },
                    { 13, new TimeSpan(0, 23, 0, 0, 0), 5, false, new TimeSpan(0, 12, 0, 0, 0), 2 },
                    { 14, new TimeSpan(0, 23, 0, 0, 0), 6, false, new TimeSpan(0, 12, 0, 0, 0), 2 },
                    { 15, new TimeSpan(0, 22, 0, 0, 0), 0, false, new TimeSpan(0, 12, 0, 0, 0), 3 },
                    { 16, new TimeSpan(0, 22, 0, 0, 0), 1, true, new TimeSpan(0, 12, 0, 0, 0), 3 },
                    { 17, new TimeSpan(0, 22, 0, 0, 0), 2, false, new TimeSpan(0, 12, 0, 0, 0), 3 },
                    { 18, new TimeSpan(0, 22, 0, 0, 0), 3, false, new TimeSpan(0, 12, 0, 0, 0), 3 },
                    { 19, new TimeSpan(0, 22, 0, 0, 0), 4, false, new TimeSpan(0, 12, 0, 0, 0), 3 },
                    { 20, new TimeSpan(0, 22, 0, 0, 0), 5, false, new TimeSpan(0, 12, 0, 0, 0), 3 },
                    { 21, new TimeSpan(0, 22, 0, 0, 0), 6, false, new TimeSpan(0, 12, 0, 0, 0), 3 },
                    { 22, new TimeSpan(0, 23, 59, 0, 0), 0, false, new TimeSpan(0, 11, 0, 0, 0), 4 },
                    { 23, new TimeSpan(0, 23, 59, 0, 0), 1, false, new TimeSpan(0, 11, 0, 0, 0), 4 },
                    { 24, new TimeSpan(0, 23, 59, 0, 0), 2, false, new TimeSpan(0, 11, 0, 0, 0), 4 },
                    { 25, new TimeSpan(0, 23, 59, 0, 0), 3, false, new TimeSpan(0, 11, 0, 0, 0), 4 },
                    { 26, new TimeSpan(0, 23, 59, 0, 0), 4, false, new TimeSpan(0, 11, 0, 0, 0), 4 },
                    { 27, new TimeSpan(0, 23, 59, 0, 0), 5, false, new TimeSpan(0, 11, 0, 0, 0), 4 },
                    { 28, new TimeSpan(0, 23, 59, 0, 0), 6, false, new TimeSpan(0, 11, 0, 0, 0), 4 },
                    { 29, new TimeSpan(0, 21, 0, 0, 0), 0, false, new TimeSpan(0, 9, 0, 0, 0), 5 },
                    { 30, new TimeSpan(0, 21, 0, 0, 0), 1, false, new TimeSpan(0, 9, 0, 0, 0), 5 },
                    { 31, new TimeSpan(0, 21, 0, 0, 0), 2, false, new TimeSpan(0, 9, 0, 0, 0), 5 },
                    { 32, new TimeSpan(0, 21, 0, 0, 0), 3, false, new TimeSpan(0, 9, 0, 0, 0), 5 },
                    { 33, new TimeSpan(0, 21, 0, 0, 0), 4, false, new TimeSpan(0, 9, 0, 0, 0), 5 },
                    { 34, new TimeSpan(0, 21, 0, 0, 0), 5, false, new TimeSpan(0, 9, 0, 0, 0), 5 },
                    { 35, new TimeSpan(0, 21, 0, 0, 0), 6, false, new TimeSpan(0, 9, 0, 0, 0), 5 },
                    { 36, new TimeSpan(0, 23, 0, 0, 0), 0, false, new TimeSpan(0, 12, 0, 0, 0), 6 },
                    { 37, new TimeSpan(0, 23, 0, 0, 0), 1, false, new TimeSpan(0, 12, 0, 0, 0), 6 },
                    { 38, new TimeSpan(0, 23, 0, 0, 0), 2, true, new TimeSpan(0, 12, 0, 0, 0), 6 },
                    { 39, new TimeSpan(0, 23, 0, 0, 0), 3, false, new TimeSpan(0, 12, 0, 0, 0), 6 },
                    { 40, new TimeSpan(0, 23, 0, 0, 0), 4, false, new TimeSpan(0, 12, 0, 0, 0), 6 },
                    { 41, new TimeSpan(0, 23, 0, 0, 0), 5, false, new TimeSpan(0, 12, 0, 0, 0), 6 },
                    { 42, new TimeSpan(0, 23, 0, 0, 0), 6, false, new TimeSpan(0, 12, 0, 0, 0), 6 }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "PasswordHash", "RestaurantId", "Role" },
                values: new object[,]
                {
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@bellanapoli.co.uk", "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 2, "Staff" },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@sakurasushi.co.uk", "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 3, "Staff" },
                    { 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@burgerjoint.co.uk", "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 4, "Staff" },
                    { 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@greenbowl.co.uk", "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 5, "Staff" },
                    { 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@dragonwok.co.uk", "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 6, "Staff" }
                });

            migrationBuilder.InsertData(
                table: "MenuItems",
                columns: new[] { "Id", "Allergens", "CategoryId", "CreatedAt", "Description", "DietaryTags", "IsAvailable", "Name", "Price", "RestaurantId" },
                values: new object[,]
                {
                    { 9, "[\"gluten\"]", 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Toasted bread, tomato, basil", "[\"vegan\"]", true, "Bruschetta", 5.50m, 2 },
                    { 10, "[\"gluten\",\"milk\"]", 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Fried risotto balls (3)", null, true, "Arancini", 6.50m, 2 },
                    { 11, "[\"gluten\",\"milk\"]", 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tomato, mozzarella, basil", "[\"vegetarian\"]", true, "Margherita Pizza", 10.95m, 2 },
                    { 12, "[\"gluten\",\"milk\"]", 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Spicy pepperoni, mozzarella", null, true, "Pepperoni Pizza", 12.95m, 2 },
                    { 13, "[\"gluten\",\"milk\",\"egg\"]", 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Egg, pancetta, pecorino", null, true, "Spaghetti Carbonara", 12.50m, 2 },
                    { 14, "[\"gluten\",\"milk\"]", 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "Garlic Bread", 4.00m, 2 },
                    { 15, "[\"egg\",\"fish\",\"milk\"]", 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "Caesar Salad", 7.50m, 2 },
                    { 16, null, 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", true, "San Pellegrino", 2.95m, 2 },
                    { 17, "[\"soy\"]", 9, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Steamed soy beans, sea salt", "[\"vegan\",\"gluten-free\"]", true, "Edamame", 4.25m, 3 },
                    { 18, "[\"soy\"]", 9, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tofu, wakame, spring onion", "[\"vegan\"]", true, "Miso Soup", 3.50m, 3 },
                    { 19, "[\"fish\"]", 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Fresh sliced salmon", "[\"gluten-free\"]", true, "Salmon Sashimi (8pc)", 14.50m, 3 },
                    { 20, "[\"fish\",\"soy\",\"sesame\"]", 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Eel, avocado, cucumber", null, true, "Dragon Roll", 13.95m, 3 },
                    { 21, "[\"gluten\",\"egg\"]", 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Crispy chicken, Japanese curry", null, true, "Chicken Katsu Curry", 11.95m, 3 },
                    { 22, null, 11, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", true, "Steamed Rice", 2.50m, 3 },
                    { 23, "[\"gluten\",\"soy\"]", 11, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Pork dumplings", null, true, "Gyoza (5pc)", 5.95m, 3 },
                    { 24, null, 12, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", true, "Green Tea", 2.25m, 3 },
                    { 25, "[\"milk\"]", 13, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Spicy chicken wings, blue cheese", null, true, "Buffalo Wings (6)", 6.95m, 4 },
                    { 26, "[\"gluten\",\"milk\"]", 13, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegetarian\"]", true, "Mozzarella Sticks", 5.50m, 4 },
                    { 27, "[\"gluten\",\"milk\"]", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Beef, cheddar, lettuce, pickle", null, true, "Classic Cheeseburger", 9.95m, 4 },
                    { 28, "[\"gluten\",\"milk\"]", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Beef, bacon, BBQ, onion ring", null, true, "BBQ Bacon Burger", 11.50m, 4 },
                    { 29, "[\"gluten\",\"soy\"]", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Plant patty, vegan cheese", "[\"vegan\"]", true, "Beyond Vegan Burger", 10.95m, 4 },
                    { 30, "[\"milk\"]", 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cheese, bacon, jalapeños", null, true, "Loaded Fries", 5.50m, 4 },
                    { 31, "[\"gluten\"]", 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\"]", true, "Onion Rings", 3.95m, 4 },
                    { 32, "[\"milk\"]", 16, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "Chocolate Milkshake", 4.50m, 4 },
                    { 33, "[\"gluten\",\"sesame\"]", 17, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chickpea hummus, warm pita", "[\"vegan\"]", true, "Hummus & Pita", 4.95m, 5 },
                    { 34, "[\"gluten\"]", 17, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sourdough, avo, chilli flakes", "[\"vegan\"]", true, "Avocado Toast", 6.50m, 5 },
                    { 35, "[\"sesame\"]", 18, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Quinoa, kale, beetroot, tahini", "[\"vegan\",\"gluten-free\"]", true, "Quinoa Buddha Bowl", 10.95m, 5 },
                    { 36, "[\"fish\",\"soy\"]", 18, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Salmon, brown rice, edamame", "[\"gluten-free\"]", true, "Grilled Salmon Bowl", 13.50m, 5 },
                    { 37, "[\"gluten\",\"sesame\"]", 18, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Falafel, salad, tahini wrap", "[\"vegan\"]", true, "Falafel Wrap", 8.95m, 5 },
                    { 38, null, 19, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", true, "Sweet Potato Fries", 4.25m, 5 },
                    { 39, null, 19, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", true, "Side Salad", 3.50m, 5 },
                    { 40, null, 20, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Apple, ginger, lemon", "[\"vegan\",\"gluten-free\"]", true, "Cold-Pressed Juice", 4.95m, 5 },
                    { 41, "[\"gluten\",\"soy\"]", 21, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Vegetable spring rolls", "[\"vegan\"]", true, "Spring Rolls (4)", 4.50m, 6 },
                    { 42, "[\"gluten\",\"soy\",\"sesame\"]", 21, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Quarter duck, pancakes, hoisin", null, true, "Crispy Duck Pancakes", 12.95m, 6 },
                    { 43, "[\"gluten\",\"egg\"]", 22, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Battered chicken, peppers", null, true, "Sweet & Sour Chicken", 9.95m, 6 },
                    { 44, "[\"peanut\",\"soy\",\"gluten\"]", 22, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Beef, peanuts, Szechuan", null, true, "Kung Pao Beef", 11.50m, 6 },
                    { 45, "[\"soy\",\"gluten\"]", 22, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Soft tofu, chilli bean sauce", "[\"vegetarian\"]", true, "Mapo Tofu", 9.50m, 6 },
                    { 46, "[\"egg\",\"soy\"]", 23, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "Egg Fried Rice", 3.50m, 6 },
                    { 47, "[\"egg\",\"soy\",\"shellfish\"]", 23, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Curry vermicelli noodles", null, true, "Singapore Noodles", 8.95m, 6 },
                    { 48, null, 24, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", true, "Jasmine Tea", 2.00m, 6 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "RestaurantHours",
                keyColumn: "Id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "MenuCategories",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
