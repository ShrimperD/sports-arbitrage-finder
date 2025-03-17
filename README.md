# Sports Arbitrage Finder

A real-time sports arbitrage opportunity finder that helps identify profitable betting opportunities across multiple bookmakers.

## Features

- Real-time odds tracking
- Multiple bookmaker support
- Customizable filters for minimum return and profit
- Auto-refresh capabilities
- Mobile-responsive design
- American and decimal odds display

## Deployment

This application is configured for deployment on Render.com as a static site.

### Deploy to Render

1. Fork or clone this repository
2. Connect your GitHub account to Render.com
3. Create a new Static Site on Render
4. Select this repository
5. The configuration in `render.yaml` will handle the rest

## Environment Variables

The application uses the following environment variable:

- `NEXT_PUBLIC_ODDS_API_KEY`: Your API key from the-odds-api.com

## Local Development

To run locally, simply serve the contents of the `public` directory using any static file server. 