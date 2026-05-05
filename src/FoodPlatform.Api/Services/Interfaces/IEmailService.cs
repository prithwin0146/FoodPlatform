namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Transactional email contract — one method per lifecycle event.
/// (SRP: email concern is fully isolated; swap Resend → SendGrid without touching callers)
/// (ISP: callers only import the methods they trigger)
/// </summary>
public interface IEmailService
{
    Task SendOrderPlacedAsync(string toEmail, string toName, int orderId,
        string restaurantName, decimal total, string deliveryAddress);

    Task SendOrderAcceptedAsync(string toEmail, string toName, int orderId,
        string restaurantName, DateTime eta);

    Task SendOrderRejectedAsync(string toEmail, string toName, int orderId,
        string restaurantName, string reason);

    Task SendOrderCancelledAsync(string toEmail, string toName, int orderId,
        string restaurantName);

    Task SendOrderDeliveredAsync(string toEmail, string toName, int orderId,
        string restaurantName);

    Task SendOtpAsync(string toEmail, string toName, string otp);
}
