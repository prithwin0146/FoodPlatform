# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + project files first for layer-cached restore
COPY FoodPlatform.sln ./
COPY src/FoodPlatform.Api/FoodPlatform.Api.csproj src/FoodPlatform.Api/
COPY tests/FoodPlatform.Tests/FoodPlatform.Tests.csproj tests/FoodPlatform.Tests/

RUN dotnet restore src/FoodPlatform.Api/FoodPlatform.Api.csproj

# Copy everything else and publish
COPY src/FoodPlatform.Api/ src/FoodPlatform.Api/
RUN dotnet publish src/FoodPlatform.Api/FoodPlatform.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Render injects PORT; default to 8080 for local Docker runs
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "FoodPlatform.Api.dll"]
