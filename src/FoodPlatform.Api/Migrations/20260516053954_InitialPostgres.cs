using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Restaurants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    BasePostcode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DeliveryRadiusMiles = table.Column<double>(type: "double precision", nullable: false),
                    HygieneRating = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    KitchenVideoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CuisineType = table.Column<string>(type: "text", nullable: false),
                    EstimatedDeliveryMinutes = table.Column<int>(type: "integer", nullable: false),
                    StripeAccountId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Restaurants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuCategories_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantHours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<int>(type: "integer", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    OpenTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    CloseTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    IsClosed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantHours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RestaurantHours_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<int>(type: "integer", nullable: true),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    IsEmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    OtpCode = table.Column<string>(type: "text", nullable: true),
                    OtpExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OtpSentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MenuItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Allergens = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DietaryTags = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItems_MenuCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "MenuCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MenuItems_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    RejectionReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DisputeStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "None"),
                    DisputeNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DeliveryAddressLine1 = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    DeliveryCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DeliveryPostcode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SpecialInstructions = table.Column<string>(type: "text", nullable: true),
                    EstimatedDeliveryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancellableUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Orders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    MenuItemId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderItems_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    RestaurantId = table.Column<int>(type: "integer", nullable: false),
                    Stars = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Restaurants",
                columns: new[] { "Id", "Address", "BasePostcode", "CreatedAt", "CuisineType", "DeliveryRadiusMiles", "EstimatedDeliveryMinutes", "HygieneRating", "ImageUrl", "IsActive", "KitchenVideoUrl", "Name", "StripeAccountId" },
                values: new object[,]
                {
                    { 1, "42 High Street, Westminster, London", "SW1A 1AA", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Other", 3.0, 30, 5, null, true, null, "Spice Garden", null },
                    { 2, "18 Soho Square, London", "W1D 3QL", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Other", 2.5, 30, 5, null, true, null, "Bella Napoli", null },
                    { 3, "7 Shoreditch High Street, London", "E1 6JE", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Other", 4.0, 30, 5, null, true, null, "Sakura Sushi", null },
                    { 4, "55 Camden High Street, London", "NW1 7JH", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Other", 3.5, 30, 4, null, true, null, "The Burger Joint", null },
                    { 5, "12 Notting Hill Gate, London", "W11 3HR", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Other", 3.0, 30, 5, null, true, null, "Green Bowl", null },
                    { 6, "88 Gerrard Street, Chinatown, London", "W1D 5PT", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Other", 2.5, 30, 4, null, true, null, "Dragon Wok", null }
                });

            migrationBuilder.InsertData(
                table: "MenuCategories",
                columns: new[] { "Id", "Name", "RestaurantId", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Starters", 1, 0 },
                    { 2, "Mains", 1, 1 },
                    { 3, "Sides", 1, 2 },
                    { 4, "Drinks", 1, 3 },
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
                    { 1, new TimeSpan(0, 23, 0, 0, 0), 0, true, new TimeSpan(0, 11, 0, 0, 0), 1 },
                    { 2, new TimeSpan(0, 23, 0, 0, 0), 1, false, new TimeSpan(0, 11, 0, 0, 0), 1 },
                    { 3, new TimeSpan(0, 23, 0, 0, 0), 2, false, new TimeSpan(0, 11, 0, 0, 0), 1 },
                    { 4, new TimeSpan(0, 23, 0, 0, 0), 3, false, new TimeSpan(0, 11, 0, 0, 0), 1 },
                    { 5, new TimeSpan(0, 23, 0, 0, 0), 4, false, new TimeSpan(0, 11, 0, 0, 0), 1 },
                    { 6, new TimeSpan(0, 23, 0, 0, 0), 5, false, new TimeSpan(0, 11, 0, 0, 0), 1 },
                    { 7, new TimeSpan(0, 23, 0, 0, 0), 6, false, new TimeSpan(0, 11, 0, 0, 0), 1 },
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
                table: "MenuItems",
                columns: new[] { "Id", "Allergens", "CategoryId", "CreatedAt", "Description", "DietaryTags", "ImageUrl", "IsAvailable", "Name", "Price", "RestaurantId" },
                values: new object[,]
                {
                    { 1, "[\"gluten\"]", 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Crispy onion fritters", "[\"vegan\"]", null, true, "Onion Bhaji", 4.50m, 1 },
                    { 2, "[\"gluten\"]", 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Vegetable samosa (2 pieces)", "[\"vegan\"]", null, true, "Samosa", 3.95m, 1 },
                    { 3, "[\"milk\"]", 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Creamy tomato-based curry", null, null, true, "Chicken Tikka Masala", 11.95m, 1 },
                    { 4, null, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Slow-cooked lamb in rich sauce", null, null, true, "Lamb Rogan Josh", 13.50m, 1 },
                    { 5, null, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chickpea curry", "[\"vegan\",\"gluten-free\"]", null, true, "Chana Masala", 9.50m, 1 },
                    { 6, null, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", null, true, "Pilau Rice", 3.00m, 1 },
                    { 7, "[\"gluten\",\"milk\"]", 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, "Garlic Naan", 2.50m, 1 },
                    { 8, "[\"milk\"]", 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, "Mango Lassi", 3.50m, 1 },
                    { 9, "[\"gluten\"]", 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Toasted bread, tomato, basil", "[\"vegan\"]", null, true, "Bruschetta", 5.50m, 2 },
                    { 10, "[\"gluten\",\"milk\"]", 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Fried risotto balls (3)", null, null, true, "Arancini", 6.50m, 2 },
                    { 11, "[\"gluten\",\"milk\"]", 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tomato, mozzarella, basil", "[\"vegetarian\"]", null, true, "Margherita Pizza", 10.95m, 2 },
                    { 12, "[\"gluten\",\"milk\"]", 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Spicy pepperoni, mozzarella", null, null, true, "Pepperoni Pizza", 12.95m, 2 },
                    { 13, "[\"gluten\",\"milk\",\"egg\"]", 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Egg, pancetta, pecorino", null, null, true, "Spaghetti Carbonara", 12.50m, 2 },
                    { 14, "[\"gluten\",\"milk\"]", 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, "Garlic Bread", 4.00m, 2 },
                    { 15, "[\"egg\",\"fish\",\"milk\"]", 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, "Caesar Salad", 7.50m, 2 },
                    { 16, null, 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", null, true, "San Pellegrino", 2.95m, 2 },
                    { 17, "[\"soy\"]", 9, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Steamed soy beans, sea salt", "[\"vegan\",\"gluten-free\"]", null, true, "Edamame", 4.25m, 3 },
                    { 18, "[\"soy\"]", 9, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tofu, wakame, spring onion", "[\"vegan\"]", null, true, "Miso Soup", 3.50m, 3 },
                    { 19, "[\"fish\"]", 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Fresh sliced salmon", "[\"gluten-free\"]", null, true, "Salmon Sashimi (8pc)", 14.50m, 3 },
                    { 20, "[\"fish\",\"soy\",\"sesame\"]", 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Eel, avocado, cucumber", null, null, true, "Dragon Roll", 13.95m, 3 },
                    { 21, "[\"gluten\",\"egg\"]", 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Crispy chicken, Japanese curry", null, null, true, "Chicken Katsu Curry", 11.95m, 3 },
                    { 22, null, 11, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", null, true, "Steamed Rice", 2.50m, 3 },
                    { 23, "[\"gluten\",\"soy\"]", 11, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Pork dumplings", null, null, true, "Gyoza (5pc)", 5.95m, 3 },
                    { 24, null, 12, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", null, true, "Green Tea", 2.25m, 3 },
                    { 25, "[\"milk\"]", 13, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Spicy chicken wings, blue cheese", null, null, true, "Buffalo Wings (6)", 6.95m, 4 },
                    { 26, "[\"gluten\",\"milk\"]", 13, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegetarian\"]", null, true, "Mozzarella Sticks", 5.50m, 4 },
                    { 27, "[\"gluten\",\"milk\"]", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Beef, cheddar, lettuce, pickle", null, null, true, "Classic Cheeseburger", 9.95m, 4 },
                    { 28, "[\"gluten\",\"milk\"]", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Beef, bacon, BBQ, onion ring", null, null, true, "BBQ Bacon Burger", 11.50m, 4 },
                    { 29, "[\"gluten\",\"soy\"]", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Plant patty, vegan cheese", "[\"vegan\"]", null, true, "Beyond Vegan Burger", 10.95m, 4 },
                    { 30, "[\"milk\"]", 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cheese, bacon, jalapeños", null, null, true, "Loaded Fries", 5.50m, 4 },
                    { 31, "[\"gluten\"]", 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\"]", null, true, "Onion Rings", 3.95m, 4 },
                    { 32, "[\"milk\"]", 16, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, "Chocolate Milkshake", 4.50m, 4 },
                    { 33, "[\"gluten\",\"sesame\"]", 17, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chickpea hummus, warm pita", "[\"vegan\"]", null, true, "Hummus & Pita", 4.95m, 5 },
                    { 34, "[\"gluten\"]", 17, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sourdough, avo, chilli flakes", "[\"vegan\"]", null, true, "Avocado Toast", 6.50m, 5 },
                    { 35, "[\"sesame\"]", 18, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Quinoa, kale, beetroot, tahini", "[\"vegan\",\"gluten-free\"]", null, true, "Quinoa Buddha Bowl", 10.95m, 5 },
                    { 36, "[\"fish\",\"soy\"]", 18, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Salmon, brown rice, edamame", "[\"gluten-free\"]", null, true, "Grilled Salmon Bowl", 13.50m, 5 },
                    { 37, "[\"gluten\",\"sesame\"]", 18, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Falafel, salad, tahini wrap", "[\"vegan\"]", null, true, "Falafel Wrap", 8.95m, 5 },
                    { 38, null, 19, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", null, true, "Sweet Potato Fries", 4.25m, 5 },
                    { 39, null, 19, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", null, true, "Side Salad", 3.50m, 5 },
                    { 40, null, 20, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Apple, ginger, lemon", "[\"vegan\",\"gluten-free\"]", null, true, "Cold-Pressed Juice", 4.95m, 5 },
                    { 41, "[\"gluten\",\"soy\"]", 21, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Vegetable spring rolls", "[\"vegan\"]", null, true, "Spring Rolls (4)", 4.50m, 6 },
                    { 42, "[\"gluten\",\"soy\",\"sesame\"]", 21, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Quarter duck, pancakes, hoisin", null, null, true, "Crispy Duck Pancakes", 12.95m, 6 },
                    { 43, "[\"gluten\",\"egg\"]", 22, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Battered chicken, peppers", null, null, true, "Sweet & Sour Chicken", 9.95m, 6 },
                    { 44, "[\"peanut\",\"soy\",\"gluten\"]", 22, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Beef, peanuts, Szechuan", null, null, true, "Kung Pao Beef", 11.50m, 6 },
                    { 45, "[\"soy\",\"gluten\"]", 22, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Soft tofu, chilli bean sauce", "[\"vegetarian\"]", null, true, "Mapo Tofu", 9.50m, 6 },
                    { 46, "[\"egg\",\"soy\"]", 23, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, "Egg Fried Rice", 3.50m, 6 },
                    { 47, "[\"egg\",\"soy\",\"shellfish\"]", 23, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Curry vermicelli noodles", null, null, true, "Singapore Noodles", 8.95m, 6 },
                    { 48, null, 24, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", null, true, "Jasmine Tea", 2.00m, 6 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MenuCategories_RestaurantId",
                table: "MenuCategories",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_CategoryId",
                table: "MenuItems",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_RestaurantId",
                table: "MenuItems",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_MenuItemId",
                table: "OrderItems",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_RestaurantId",
                table: "Orders",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId",
                table: "Orders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantHours_RestaurantId",
                table: "RestaurantHours",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_CustomerId",
                table: "Reviews",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_OrderId",
                table: "Reviews",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_RestaurantId",
                table: "Reviews",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RestaurantId",
                table: "Users",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "RestaurantHours");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "MenuItems");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "MenuCategories");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Restaurants");
        }
    }
}
