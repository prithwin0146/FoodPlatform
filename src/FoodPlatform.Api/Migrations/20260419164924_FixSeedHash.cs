using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixSeedHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$K3rFzEGOL0Hk8zLXxVq9QOZFjKPGB5VaW.FGi4YM4LdPqMYFnMKKy");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$K3rFzEGOL0Hk8zLXxVq9QOZFjKPGB5VaW.FGi4YM4LdPqMYFnMKKy");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$K3rFzEGOL0Hk8zLXxVq9QOZFjKPGB5VaW.FGi4YM4LdPqMYFnMKKy");
        }
    }
}
