using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Reforge.Infra.Migrations
{
    /// <inheritdoc />
    public partial class RemoveClosedDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClosedDays");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClosedDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Analysis = table.Column<string>(type: "text", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    IsTrainingDay = table.Column<bool>(type: "boolean", nullable: false),
                    MealsCount = table.Column<int>(type: "integer", nullable: false),
                    TotalCalories = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClosedDays", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClosedDays_UserId_Date",
                table: "ClosedDays",
                columns: new[] { "UserId", "Date" },
                unique: true);
        }
    }
}
