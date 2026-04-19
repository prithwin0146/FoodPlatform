using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Restaurants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    BasePostcode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DeliveryRadiusMiles = table.Column<double>(type: "float", nullable: false),
                    HygieneRating = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    StripeAccountId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Restaurants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RestaurantId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RestaurantId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    OpenTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    CloseTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    IsClosed = table.Column<bool>(type: "bit", nullable: false)
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RestaurantId = table.Column<int>(type: "int", nullable: true),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RestaurantId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Allergens = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DietaryTags = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RestaurantId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    RejectionReason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DisputeStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "None"),
                    DisputeNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IdempotencyKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DeliveryAddressLine1 = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DeliveryCity = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DeliveryPostcode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    EstimatedDeliveryTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancellableUntil = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
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
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
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

            migrationBuilder.InsertData(
                table: "Restaurants",
                columns: new[] { "Id", "Address", "BasePostcode", "CreatedAt", "DeliveryRadiusMiles", "HygieneRating", "IsActive", "Name", "StripeAccountId" },
                values: new object[] { 1, "42 High Street, Westminster, London", "SW1A 1AA", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3.0, 5, true, "Spice Garden", null });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "PasswordHash", "RestaurantId", "Role" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@foodplatform.co.uk", "$2a$11$K3rFzEGOL0Hk8zLXxVq9QOZFjKPGB5VaW.FGi4YM4LdPqMYFnMKKy", null, "Admin" },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "customer@example.com", "$2a$11$K3rFzEGOL0Hk8zLXxVq9QOZFjKPGB5VaW.FGi4YM4LdPqMYFnMKKy", null, "Customer" }
                });

            migrationBuilder.InsertData(
                table: "MenuCategories",
                columns: new[] { "Id", "Name", "RestaurantId", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Starters", 1, 0 },
                    { 2, "Mains", 1, 1 },
                    { 3, "Sides", 1, 2 },
                    { 4, "Drinks", 1, 3 }
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
                    { 7, new TimeSpan(0, 23, 0, 0, 0), 6, false, new TimeSpan(0, 11, 0, 0, 0), 1 }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "PasswordHash", "RestaurantId", "Role" },
                values: new object[] { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@spicegarden.co.uk", "$2a$11$K3rFzEGOL0Hk8zLXxVq9QOZFjKPGB5VaW.FGi4YM4LdPqMYFnMKKy", 1, "Staff" });

            migrationBuilder.InsertData(
                table: "MenuItems",
                columns: new[] { "Id", "Allergens", "CategoryId", "CreatedAt", "Description", "DietaryTags", "IsAvailable", "Name", "Price", "RestaurantId" },
                values: new object[,]
                {
                    { 1, "[\"gluten\"]", 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Crispy onion fritters", "[\"vegan\"]", true, "Onion Bhaji", 4.50m, 1 },
                    { 2, "[\"gluten\"]", 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Vegetable samosa (2 pieces)", "[\"vegan\"]", true, "Samosa", 3.95m, 1 },
                    { 3, "[\"milk\"]", 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Creamy tomato-based curry", null, true, "Chicken Tikka Masala", 11.95m, 1 },
                    { 4, null, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Slow-cooked lamb in rich sauce", null, true, "Lamb Rogan Josh", 13.50m, 1 },
                    { 5, null, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chickpea curry", "[\"vegan\",\"gluten-free\"]", true, "Chana Masala", 9.50m, 1 },
                    { 6, null, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"vegan\",\"gluten-free\"]", true, "Pilau Rice", 3.00m, 1 },
                    { 7, "[\"gluten\",\"milk\"]", 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "Garlic Naan", 2.50m, 1 },
                    { 8, "[\"milk\"]", 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, true, "Mango Lassi", 3.50m, 1 }
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
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RestaurantId",
                table: "Users",
                column: "RestaurantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "RestaurantHours");

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
