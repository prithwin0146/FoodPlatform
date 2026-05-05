using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "IsEmailVerified", "OtpCode", "OtpExpiresAt", "PasswordHash", "RestaurantId", "Role", "Username" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@foodplatform.co.uk", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", null, "Admin", "admin" },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@spicegarden.co.uk", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 1, "Staff", "spicegarden" },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "customer@example.com", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", null, "Customer", "demo" },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@bellanapoli.co.uk", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 2, "Staff", "bellanapoli" },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@sakurasushi.co.uk", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 3, "Staff", "sakurasushi" },
                    { 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@burgerjoint.co.uk", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 4, "Staff", "burgerjoint" },
                    { 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@greenbowl.co.uk", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 5, "Staff", "greenbowl" },
                    { 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "staff@dragonwok.co.uk", true, null, null, "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim", 6, "Staff", "dragonwok" }
                });
        }
    }
}
