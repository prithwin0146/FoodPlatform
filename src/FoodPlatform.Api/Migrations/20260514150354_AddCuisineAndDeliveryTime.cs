using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCuisineAndDeliveryTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CuisineType",
                table: "Restaurants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDeliveryMinutes",
                table: "Restaurants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CuisineType", "EstimatedDeliveryMinutes" },
                values: new object[] { "Indian", 35 });

            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CuisineType", "EstimatedDeliveryMinutes" },
                values: new object[] { "Italian", 30 });

            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CuisineType", "EstimatedDeliveryMinutes" },
                values: new object[] { "Japanese", 40 });

            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CuisineType", "EstimatedDeliveryMinutes" },
                values: new object[] { "Burgers", 25 });

            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CuisineType", "EstimatedDeliveryMinutes" },
                values: new object[] { "Healthy", 20 });

            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CuisineType", "EstimatedDeliveryMinutes" },
                values: new object[] { "Chinese", 30 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CuisineType",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "EstimatedDeliveryMinutes",
                table: "Restaurants");
        }
    }
}
