using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace FoodPlatform.Api.Infrastructure;

/// <summary>
/// Provides caching for semi-static data to improve performance.
/// Implements a singleton service for application-wide caching.
/// </summary>
public interface IMemoryCacheService
{
    /// <summary>
    /// Gets a cached item or creates it using the provided factory function.
    /// </summary>
    /// <typeparam name="T">The type of item to cache</typeparam>
    /// <param name="key">The cache key</param>
    /// <param name="factory">Function to create the item if not in cache</param>
    /// <param name="absoluteExpirationRelativeToNow">How long the item should be cached</param>
    /// <returns>The cached item</returns>
    T GetOrCreate<T>(string key, Func<ICacheEntry, T> factory, TimeSpan? absoluteExpirationRelativeToNow = null);

    /// <summary>
    /// Removes an item from the cache by key
    /// </summary>
    /// <param name="key">The cache key to remove</param>
    void Remove(string key);

    /// <summary>
    /// Gets a cached item or creates it using the provided async factory function.
    /// </summary>
    /// <typeparam name="T">The type of item to cache</typeparam>
    /// <param name="key">The cache key</param>
    /// <param name="factory">Async function to create the item if not in cache</param>
    /// <param name="absoluteExpirationRelativeToNow">How long the item should be cached</param>
    /// <returns>The cached item</returns>
    Task<T> GetOrCreateAsync<T>(string key, Func<ICacheEntry, Task<T>> factory, TimeSpan? absoluteExpirationRelativeToNow = null);
}

/// <summary>

/// <summary>
/// Implementation of IMemoryCacheService using Microsoft's MemoryCache
/// </summary>
public class MemoryCacheService : IMemoryCacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;

    public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public T GetOrCreate<T>(string key, Func<ICacheEntry, T> factory, TimeSpan? absoluteExpirationRelativeToNow = null)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        if (factory == null)
            throw new ArgumentNullException(nameof(factory));

        var options = new MemoryCacheEntryOptions();
        if (absoluteExpirationRelativeToNow.HasValue)
        {
            options.SetAbsoluteExpiration(absoluteExpirationRelativeToNow.Value);
        }

        return _cache.GetOrCreate(key, entry =>
        {
            if (absoluteExpirationRelativeToNow.HasValue)
            {
                entry.SetAbsoluteExpiration(absoluteExpirationRelativeToNow.Value);
            }
            return factory(entry);
        })!;
    }

    public void Remove(string key)
    {
        if (!string.IsNullOrWhiteSpace(key))
        {
            _cache.Remove(key);
        }
    }

    public void Clear()
    {
        // Note: MemoryCache doesn't have a direct Clear() method
        // We would need to track keys or use a different approach for full cache clearing
        _logger.LogWarning("Cache clear requested - consider implementing key tracking for full cache clearing");
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<ICacheEntry, Task<T>> factory, TimeSpan? absoluteExpirationRelativeToNow = null)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        if (factory == null)
            throw new ArgumentNullException(nameof(factory));

        // note: GetOrCreateAsync returns null if factory returns null, but our callers never do
 #pragma warning disable CS8603
        return await _cache.GetOrCreateAsync(key, async entry =>
        {
            if (absoluteExpirationRelativeToNow.HasValue)
                entry.SetAbsoluteExpiration(absoluteExpirationRelativeToNow.Value);
            return await factory(entry);
        });
#pragma warning restore CS8603
    }
}
