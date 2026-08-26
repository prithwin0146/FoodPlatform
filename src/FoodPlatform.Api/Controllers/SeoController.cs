using FoodPlatform.Api.Data;
using FoodPlatform.Api.Domain;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Xml;

namespace FoodPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeoController : ControllerBase
{
    private readonly FoodPlatformDbContext _context;
    private readonly IUrlEncryptionService _urlEncryptionService;

    public SeoController(FoodPlatformDbContext context, IUrlEncryptionService urlEncryptionService)
    {
        _context = context;
        _urlEncryptionService = urlEncryptionService;
    }

    [HttpGet("sitemap.xml")]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemap()
    {
        var baseUrl = "https://seetheprep.com";

        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"");
        sb.AppendLine("        xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">");

        // Static Pages
        var staticPages = new[]
        {
            new { Url = "/", Priority = "1.0", Freq = "daily" },
            new { Url = "/restaurants", Priority = "0.9", Freq = "hourly" },
            new { Url = "/auctions", Priority = "0.9", Freq = "hourly" },
            new { Url = "/login", Priority = "0.5", Freq = "monthly" },
            new { Url = "/register", Priority = "0.5", Freq = "monthly" },
            new { Url = "/info/about", Priority = "0.8", Freq = "monthly" },
            new { Url = "/info/list-kitchen", Priority = "0.8", Freq = "monthly" },
            new { Url = "/info/hygiene", Priority = "0.7", Freq = "monthly" },
            new { Url = "/info/chef-stories", Priority = "0.7", Freq = "monthly" },
            new { Url = "/info/help", Priority = "0.7", Freq = "monthly" },
            new { Url = "/info/careers", Priority = "0.6", Freq = "monthly" },
            new { Url = "/info/press", Priority = "0.6", Freq = "monthly" },
            new { Url = "/info/contact", Priority = "0.6", Freq = "monthly" },
            new { Url = "/info/camera-kit", Priority = "0.6", Freq = "monthly" },
            new { Url = "/info/safety", Priority = "0.6", Freq = "monthly" },
            new { Url = "/info/gift-cards", Priority = "0.6", Freq = "monthly" },
            new { Url = "/info/privacy", Priority = "0.4", Freq = "yearly" },
            new { Url = "/info/terms", Priority = "0.4", Freq = "yearly" },
            new { Url = "/info/cookies", Priority = "0.3", Freq = "yearly" },
            new { Url = "/info/accessibility", Priority = "0.3", Freq = "yearly" },
            new { Url = "/info/do-not-sell", Priority = "0.3", Freq = "yearly" }
        };

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        foreach (var p in staticPages)
        {
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{baseUrl}{p.Url}</loc>");
            sb.AppendLine($"    <lastmod>{today}</lastmod>");
            sb.AppendLine($"    <changefreq>{p.Freq}</changefreq>");
            sb.AppendLine($"    <priority>{p.Priority}</priority>");
            if (p.Url == "/" || p.Url == "/auctions" || p.Url == "/restaurants")
            {
                sb.AppendLine($"    <xhtml:link rel=\"alternate\" hreflang=\"en-GB\" href=\"{baseUrl}{p.Url}\"/>");
            }
            sb.AppendLine("  </url>");
        }

        // Active Restaurants
        var activeRestaurants = await _context.Restaurants
            .Where(r => r.IsActive)
            .Select(r => r.Id)
            .ToListAsync();

        foreach (var id in activeRestaurants)
        {
            var hashId = _urlEncryptionService.Encrypt(id);
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{baseUrl}/restaurant/{hashId}</loc>");
            sb.AppendLine($"    <lastmod>{today}</lastmod>");
            sb.AppendLine($"    <changefreq>daily</changefreq>");
            sb.AppendLine($"    <priority>0.9</priority>");
            sb.AppendLine("  </url>");
        }

        // Active Auctions
        var activeAuctions = await _context.Auctions
            .Where(a => a.Status == AuctionStatusMachine.Scheduled || a.Status == AuctionStatusMachine.Live)
            .Select(a => a.Id)
            .ToListAsync();

        foreach (var auctionId in activeAuctions)
        {
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{baseUrl}/auctions/{auctionId}</loc>");
            sb.AppendLine($"    <lastmod>{today}</lastmod>");
            sb.AppendLine($"    <changefreq>always</changefreq>");
            sb.AppendLine($"    <priority>0.8</priority>");
            sb.AppendLine("  </url>");
        }

        sb.AppendLine("</urlset>");

        return Content(sb.ToString(), "application/xml", Encoding.UTF8);
    }
}
