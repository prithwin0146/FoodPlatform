using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class Phase3_InventoryAndImport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StockCount",
                table: "MenuItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrackStock",
                table: "MenuItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 28,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 29,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 36,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 37,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 38,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 39,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 40,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 41,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 42,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 43,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 44,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 45,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 46,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 47,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: 48,
                columns: new[] { "StockCount", "TrackStock" },
                values: new object[] { null, false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StockCount",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "TrackStock",
                table: "MenuItems");
        }
    }
}
