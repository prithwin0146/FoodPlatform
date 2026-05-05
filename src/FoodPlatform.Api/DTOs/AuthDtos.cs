using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: auth DTOs isolated from menu, order and restaurant DTOs)
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RegisterRequest(
    [Required, MinLength(2), MaxLength(50)] string Username,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

public record AuthResponse(string Token, string Role, string Username, int UserId, int? RestaurantId);
