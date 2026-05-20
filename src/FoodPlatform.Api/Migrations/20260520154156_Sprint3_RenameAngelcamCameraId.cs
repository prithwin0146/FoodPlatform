using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class Sprint3_RenameAngelcamCameraId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LiveStreamPlaybackId",
                table: "Restaurants",
                newName: "AngelcamCameraId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AngelcamCameraId",
                table: "Restaurants",
                newName: "LiveStreamPlaybackId");
        }
    }
}
