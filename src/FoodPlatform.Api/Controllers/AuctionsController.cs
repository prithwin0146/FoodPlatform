using System.Security.Claims;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Public/customer-facing auction browsing and bidding.
/// (SRP: HTTP concerns only — business logic in IAuctionService)
/// </summary>
[Route("api/auctions")]
[ApiController]
public class AuctionsController(IAuctionService auctions, IAngelcamService angelcam) : ControllerBase
{
    /// <summary>Browse all currently-live auctions across every restaurant. Public — no auth required.</summary>
    [HttpGet("live")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLive() =>
        Ok(await auctions.GetLiveAsync());

    /// <summary>Single auction detail for the live-bidding page. Public — no auth required.</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var dto = await auctions.GetByIdAsync(id);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>Bid history for an auction. Public — no auth required.</summary>
    [HttpGet("{id:int}/bids")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBids(int id) =>
        Ok(await auctions.GetBidsAsync(id));

    /// <summary>Returns a fresh, time-limited Angelcam HLS URL for the auction's live camera. Public.</summary>
    [HttpGet("{id:int}/live-stream-url")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLiveStreamUrl(int id)
    {
        var auction = await auctions.GetByIdAsync(id);
        if (auction is null) return NotFound(new { error = "Auction not found" });
        if (string.IsNullOrEmpty(auction.CameraId))
            return NotFound(new { error = "No camera configured for this auction" });

        var hlsUrl = await angelcam.GetHlsUrlAsync(auction.CameraId);
        if (hlsUrl is null)
            return NotFound(new { error = "Stream is currently unavailable" });

        return Ok(new { hlsUrl });
    }

    /// <summary>Places a bid on behalf of the signed-in customer.</summary>
    [HttpPost("{id:int}/bids")]
    [Authorize]
    public async Task<IActionResult> PlaceBid(int id, PlaceBidRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var bid = await auctions.PlaceBidAsync(id, userId, request);
            return Ok(bid);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
