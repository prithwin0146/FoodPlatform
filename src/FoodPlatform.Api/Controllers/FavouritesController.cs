using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Customer-facing favourites endpoints.
/// (DIP: depends on IFavouritesService + IUrlEncryptionService, not DbContext)
/// (SRP: HTTP concerns only — business logic delegated to IFavouritesService)
/// </summary>
[Route("api/user/favourites")]
[Authorize(Roles = "Customer")]
public class FavouritesController : RestaurantScopedController
{
    private readonly IFavouritesService _favourites;
    private readonly IUrlEncryptionService _urlEncryption;

    public FavouritesController(IFavouritesService favourites, IUrlEncryptionService urlEncryption)
    {
        _favourites = favourites;
        _urlEncryption = urlEncryption;
    }

    /// <summary>Returns all restaurants the current customer has saved.</summary>
    [HttpGet]
    public async Task<IActionResult> GetFavourites()
    {
        var list = await _favourites.GetFavouritesAsync(CurrentUserId);
        return Ok(list.Select(r => r with { HashId = _urlEncryption.Encrypt(r.Id) }));
    }

    /// <summary>Saves a restaurant as a favourite.</summary>
    [HttpPost("{hash}")]
    public async Task<IActionResult> AddFavourite(string hash)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return NotFound();
        await _favourites.AddFavouriteAsync(CurrentUserId, id.Value);
        return Ok(new { message = "Added to favourites" });
    }

    /// <summary>Removes a restaurant from favourites.</summary>
    [HttpDelete("{hash}")]
    public async Task<IActionResult> RemoveFavourite(string hash)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return NotFound();
        await _favourites.RemoveFavouriteAsync(CurrentUserId, id.Value);
        return Ok(new { message = "Removed from favourites" });
    }
}
