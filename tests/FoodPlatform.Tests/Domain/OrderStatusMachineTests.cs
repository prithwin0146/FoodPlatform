using FoodPlatform.Api.Domain;
using Xunit;

namespace FoodPlatform.Tests.Domain;

/// <summary>
/// Pure unit tests for OrderStatusMachine — no IO, no mocks.
/// </summary>
public class OrderStatusMachineTests
{
    // ── CanTransition ────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Pending",        "Accepted")]
    [InlineData("Accepted",       "Preparing")]
    [InlineData("Preparing",      "Cooking")]
    [InlineData("Cooking",        "Packed")]
    [InlineData("Packed",         "OutForDelivery")]
    [InlineData("OutForDelivery", "Delivered")]
    public void CanTransition_HappyPathSteps_ReturnsTrue(string from, string to)
    {
        Assert.True(OrderStatusMachine.CanTransition(from, to));
    }

    [Theory]
    [InlineData("Pending",   "Preparing")]     // skip a step
    [InlineData("Accepted",  "Delivered")]     // jump to end
    [InlineData("Delivered", "Pending")]       // backwards
    [InlineData("Delivered", "Delivered")]     // no-op
    [InlineData("Cancelled", "Pending")]       // terminal state
    [InlineData("Pending",   "Cancelled")]     // cancel is not a status-machine transition
    [InlineData("",          "Pending")]       // empty from
    public void CanTransition_InvalidMoves_ReturnsFalse(string from, string to)
    {
        Assert.False(OrderStatusMachine.CanTransition(from, to));
    }

    // ── Next ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Next_FromDelivered_ReturnsNull()
    {
        Assert.Null(OrderStatusMachine.Next("Delivered"));
    }

    [Fact]
    public void Next_FromPending_ReturnsAccepted()
    {
        Assert.Equal("Accepted", OrderStatusMachine.Next("Pending"));
    }

    [Fact]
    public void Next_UnknownStatus_ReturnsNull()
    {
        Assert.Null(OrderStatusMachine.Next("SomeFutureStatus"));
    }

    // ── HappyPath list ───────────────────────────────────────────────────────

    [Fact]
    public void HappyPath_ContainsSevenStatuses_InOrder()
    {
        var expected = new[]
        {
            "Pending", "Accepted", "Preparing", "Cooking",
            "Packed", "OutForDelivery", "Delivered"
        };
        Assert.Equal(expected, OrderStatusMachine.HappyPath);
    }

    [Fact]
    public void HappyPath_ConsistentWithCanTransition()
    {
        // Every consecutive pair in HappyPath must satisfy CanTransition
        var path = OrderStatusMachine.HappyPath;
        for (var i = 0; i < path.Count - 1; i++)
            Assert.True(OrderStatusMachine.CanTransition(path[i], path[i + 1]),
                $"CanTransition({path[i]}, {path[i + 1]}) should be true");
    }
}
