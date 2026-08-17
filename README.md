# FareCheck

FareCheck is a mobile-first web app that helps users in India check whether an auto/rickshaw fare is reasonable.

It uses real road distance and recent community-reported fares to provide a practical fare estimate, while allowing users to report the fare they actually paid.

## Features

- **Fair Fare Estimate** — Get an estimated fare range based on real route distance and community data.
- **Driver Fare Check** — Enter the fare quoted by a driver and compare it with the estimated range.
- **Fare Reporting** — Submit the actual fare you paid to improve future estimates.
- **Location Autocomplete** — Search and select pickup and destination locations.
- **Recent Routes** — Quickly access recently checked routes.
- **No Login Required** — Designed for quick, frictionless use.
- **Android PWA** — Install FareCheck on Android and use it like a native app.

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Lucide React

**Backend**
- Node.js
- Express
- Mongoose
- Axios
- Express Rate Limit

**Database**
- MongoDB

**External Services**
- Geoapify Routing & Geocoding API

## How It Works

1. Select your pickup and destination.
2. FareCheck gets the real driving distance.
3. Recent community fare reports are analyzed for similar routes.
4. A fair fare range is calculated.
5. Compare the driver's quoted fare with the estimate.
6. Report the actual fare to contribute to the community.

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Sahil7570/farecheck.git
cd farecheck