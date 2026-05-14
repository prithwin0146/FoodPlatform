using FoodPlatform.Api.Services.Interfaces;
using Resend;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Sends transactional emails via Resend.
/// (SRP: email formatting and dispatch — no business logic)
/// (OCP: add new templates by adding a method — no existing code changes)
/// </summary>
public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly string _fromAddress;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(IResend resend, IConfiguration config,
        ILogger<ResendEmailService> logger)
    {
        _resend = resend;
        _fromAddress = config["Resend:FromAddress"] ?? "SeeThePrep <orders@seetheprep.com>";
        _logger = logger;
    }

    public async Task SendOrderPlacedAsync(string toEmail, string toName, int orderId,
        string restaurantName, decimal total, string deliveryAddress)
    {
        await SendAsync(toEmail, $"Order #{orderId} confirmed 🎉", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:linear-gradient(135deg,#ff6b1a,#ff3d8a);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>Your order is confirmed! 🎉</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>Your order from <strong>{restaurantName}</strong> has been placed and is waiting for the kitchen to accept it. We'll send you another email the moment they do.</p>
    <div style='background:#f9f9f9;border-radius:12px;padding:20px;margin:20px 0'>
      <p style='margin:0 0 8px'><strong>Order #</strong> {orderId}</p>
      <p style='margin:0 0 8px'><strong>Total:</strong> {total:C}</p>
      <p style='margin:0'><strong>Delivering to:</strong> {deliveryAddress}</p>
    </div>
    <p style='color:#888;font-size:13px'>You can cancel within 5 minutes via the order tracking page.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendOrderAcceptedAsync(string toEmail, string toName, int orderId,
        string restaurantName, DateTime eta)
    {
        var etaLocal = eta.ToString("HH:mm");
        await SendAsync(toEmail, $"Order #{orderId} accepted — ETA {etaLocal} 🍳", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:linear-gradient(135deg,#0f7a3f,#1fa363);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>Your order is being prepared! 🍳</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>Great news — <strong>{restaurantName}</strong> has accepted your order and the chef is getting started!</p>
    <div style='background:#f0fff4;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #1fa363'>
      <p style='margin:0 0 8px'><strong>Order #</strong> {orderId}</p>
      <p style='margin:0;font-size:18px'><strong>Estimated arrival:</strong> {etaLocal}</p>
    </div>
    <p>You can watch your meal being prepared live from your order tracking page.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendOrderRejectedAsync(string toEmail, string toName, int orderId,
        string restaurantName, string reason)
    {
        await SendAsync(toEmail, $"Order #{orderId} could not be fulfilled", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:#b91c1c;padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>We're sorry about your order</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>Unfortunately, <strong>{restaurantName}</strong> was unable to fulfil order #{orderId}.</p>
    <div style='background:#fff5f5;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #b91c1c'>
      <p style='margin:0'><strong>Reason:</strong> {reason}</p>
    </div>
    <p>A full refund has been issued and will appear in your account within 3–5 business days.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendOrderCancelledAsync(string toEmail, string toName, int orderId,
        string restaurantName)
    {
        await SendAsync(toEmail, $"Order #{orderId} cancelled", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:#4b5563;padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>Order cancelled</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>Your order #{orderId} from <strong>{restaurantName}</strong> has been cancelled as requested.</p>
    <p>A full refund has been issued and will appear in your account within 3–5 business days.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendOrderDeliveredAsync(string toEmail, string toName, int orderId,
        string restaurantName)
    {
        await SendAsync(toEmail, $"Order #{orderId} delivered — enjoy! 🎊", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:linear-gradient(135deg,#ff6b1a,#ff3d8a);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>Your order has arrived! 🎊</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>Your order #{orderId} from <strong>{restaurantName}</strong> has been delivered. Enjoy your meal!</p>
    <p>If anything isn't right, you can raise a dispute from your order tracking page within 24 hours.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendOtpAsync(string toEmail, string toName, string otp)
    {
        await SendAsync(toEmail, "Your SeeThePrep verification code", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:linear-gradient(135deg,#ff6b1a,#ff3d8a);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>Verify your email 🔐</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>Welcome to SeeThePrep! Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
    <div style='background:#fff8f5;border:2px dashed #ff6b1a;border-radius:12px;padding:28px;margin:24px 0;text-align:center'>
      <p style='margin:0;font-size:40px;font-weight:700;letter-spacing:10px;color:#ff6b1a;font-family:monospace'>{otp}</p>
    </div>
    <p style='color:#888;font-size:13px'>If you didn't create a SeeThePrep account, you can safely ignore this email.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendPasswordResetOtpAsync(string toEmail, string toName, string otp)
    {
        await SendAsync(toEmail, "Reset your SeeThePrep password", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>Password reset request 🔑</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>We received a request to reset your SeeThePrep password. Use the code below — it expires in <strong>10 minutes</strong>.</p>
    <div style='background:#faf5ff;border:2px dashed #7c3aed;border-radius:12px;padding:28px;margin:24px 0;text-align:center'>
      <p style='margin:0;font-size:40px;font-weight:700;letter-spacing:10px;color:#7c3aed;font-family:monospace'>{otp}</p>
    </div>
    <p style='color:#888;font-size:13px'>If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendDisputeOpenedAsync(string toEmail, string toName, int orderId,
        string restaurantName, string notes)
    {
        await SendAsync(toEmail, $"Dispute received for Order #{orderId} 🔍", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:linear-gradient(135deg,#b45309,#d97706);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>We've received your dispute 🔍</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>We've received your dispute for Order <strong>#{orderId}</strong> from <strong>{restaurantName}</strong>. Our team will review it and get back to you within 24 hours.</p>
    <div style='background:#fffbeb;border-left:4px solid #d97706;border-radius:8px;padding:16px 20px;margin:20px 0'>
      <p style='margin:0 0 6px;font-weight:700;color:#92400e'>Your notes:</p>
      <p style='margin:0;color:#78350f;font-size:14px'>{notes}</p>
    </div>
    <p style='color:#888;font-size:13px'>You can view the status of your dispute at any time from your order tracking page.</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    public async Task SendDisputeResolvedAsync(string toEmail, string toName, int orderId,
        string restaurantName, bool refunded)
    {
        var (heading, detail, emoji) = refunded
            ? ("Your refund is on its way", $"We've reviewed your dispute for Order #{orderId} from {restaurantName} and issued a full refund. Please allow 5–10 business days for it to appear on your statement.", "💸")
            : ("Your dispute has been resolved", $"We've reviewed your dispute for Order #{orderId} from {restaurantName} and closed the case. No refund has been issued.", "✅");

        await SendAsync(toEmail, $"Dispute resolved for Order #{orderId} {emoji}", $@"
<div style='font-family:sans-serif;max-width:580px;margin:0 auto;color:#1a1a2e'>
  <div style='background:{(refunded ? "linear-gradient(135deg,#065f46,#10b981)" : "linear-gradient(135deg,#1e40af,#3b82f6)")};padding:32px 24px;border-radius:16px 16px 0 0;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:24px'>{heading} {emoji}</h1>
  </div>
  <div style='background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #eee'>
    <p style='font-size:16px'>Hi <strong>{toName}</strong>,</p>
    <p>{detail}</p>
    <hr style='border:none;border-top:1px solid #eee;margin:24px 0'>
    <p style='color:#aaa;font-size:12px;text-align:center'>SeeThePrep · Watch your meal being made live 📹</p>
  </div>
</div>");
    }

    // ── private ──────────────────────────────────────────────────────────────

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var message = new EmailMessage
            {
                From = _fromAddress,
                Subject = subject,
                HtmlBody = htmlBody,
            };
            message.To.Add(toEmail);
            await _resend.EmailSendAsync(message);
        }
        catch (Exception ex)
        {
            // Email failure must never break order flow — log and continue
            _logger.LogError(ex, "Failed to send email '{Subject}' to {Email}", subject, toEmail);
        }
    }
}
