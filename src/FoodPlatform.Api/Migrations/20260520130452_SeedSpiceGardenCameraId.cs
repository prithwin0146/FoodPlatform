using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedSpiceGardenCameraId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 1,
                column: "LiveStreamPlaybackId",
                value: "133627");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: 1,
                column: "LiveStreamPlaybackId",
                value: null);
        }
    }
}
