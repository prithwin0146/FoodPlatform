# SeeThePrep / FoodPlatform

SeeThePrep is a UK food delivery platform built around kitchen transparency. Customers can browse independent restaurants, check FSA hygiene ratings and dish allergens, watch food being prepared live, and follow an order through delivery.

## What is on the landing page

The landing page is an editorial, scroll-driven introduction to the product:

- A cinematic hero uses a canvas frame sequence to move through three moments: choosing a kitchen, watching food cook, and tracking the delivery.
- The final hero scene includes a kitchen search field with live restaurant results and a direct route into restaurant browsing.
- The “Why SeeThePrep” section presents four operating standards: live camera coverage, FSA 5-star hygiene, allergen declarations, and full kitchen tip payouts.
- The page includes accessible labels, responsive layouts, scroll reveals, restaurant image fallbacks, metadata for search/social sharing, and structured FAQ/application data.
- The visual direction is bold and food-led, with warm editorial typography, energetic accents, and supporting motion while keeping the order journey clear.

The cinematic frame assets used by the landing page live in `client/public/frames/scene1`, `scene2`, and `scene3`. Smaller video assets are also available in `client/public/videos/` for supporting product media.

## Stack

- Angular 21 client with standalone components and SCSS
- .NET 8 Web API
- Entity Framework Core and SQL-backed application data
- SignalR for real-time features
- Stripe integration for payments

## Run locally

### Client

```bash
cd client
npm install
npm start
```

Open `http://localhost:4200/`.

### API

```bash
dotnet restore FoodPlatform.sln
dotnet run --project src/FoodPlatform.Api/FoodPlatform.Api.csproj
```

Copy the example appsettings files into local, untracked configuration files and provide the required database, authentication, payment, and media settings before starting the API.

## Build and test

From the repository root:

```bash
npm run build
npm test
```

The root `.gitignore` excludes build output, dependency folders, local secrets, IDE state, and generated source media. Runtime landing-page assets under `client/public/` are intentionally kept in version control.
