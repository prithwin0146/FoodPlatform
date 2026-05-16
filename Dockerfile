# Root-level Dockerfile for Render — delegates to the API project Dockerfile
# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the API project (no solution/tests needed for publish)
COPY src/FoodPlatform.Api/FoodPlatform.Api.csproj src/FoodPlatform.Api/
RUN dotnet restore src/FoodPlatform.Api/FoodPlatform.Api.csproj

# Copy source and publish
COPY src/FoodPlatform.Api/ src/FoodPlatform.Api/
RUN dotnet publish src/FoodPlatform.Api/FoodPlatform.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "FoodPlatform.Api.dll"]
