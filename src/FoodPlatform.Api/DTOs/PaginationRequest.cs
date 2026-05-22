namespace FoodPlatform.Api.DTOs;

/// <summary>
/// Self-defending pagination model — automatically caps PageSize to MaxPageSize.
/// (SRP: pagination concern only; OCP: new limits can be applied in subclasses without
///  modifying controllers; prevents runaway queries from untrusted callers)
/// </summary>
public class PaginationRequest
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;
    private int _page = 1;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value < 1 ? 1 : value;
    }
}
