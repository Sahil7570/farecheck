# FareCheck

FareCheck is a real-world, mobile-first web app that helps people in India know whether an auto/rickshaw fare is reasonable.

## Features
- **Fair Fare Calculation**: Get a fair fare range based on recent community reports and geographic distance.
- **Check Driver Price**: Enter the driver's quoted price to instantly see if it's within the usual range.
- **Report Fare**: Contribute to the community by submitting the actual fare you paid.
- **No Login Required**: Frictionless first use. History is saved locally.

## Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB

## Setup Instructions

1. **Clone and Install**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

2. **Environment Variables**
   - Create a `.env` file in the `server` directory using `server/.env.example` as a template.
   - Set `MONGODB_URI` to your MongoDB connection string.
   - Set `MAPS_API_KEY` if you are using Google Maps Distance Matrix.

3. **Database Seeding (Optional)**
   Populate your database with realistic dummy data:
   ```bash
   cd server
   node utils/seed.js
   ```

4. **Run Locally**
   Start the server:
   ```bash
   cd server
   npm start
   ```
   
   Start the client:
   ```bash
   cd client
   npm run dev
   ```

## Production Deployment
- **Frontend**: The `client` directory can be deployed directly to Vercel, Netlify, or similar static hosting platforms. Ensure you set the `VITE_API_URL` environment variable to point to your backend.
- **Backend**: The `server` directory can be deployed to Render, Railway, or Heroku. Ensure you provide the `MONGODB_URI` and other environment variables in the host's settings.
