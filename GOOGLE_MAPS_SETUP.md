# Google Maps API Setup Guide

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select existing one
4. Go to "APIs & Services" > "Library"
5. Search for "Maps JavaScript API" and click "Enable"
6. Go to "Credentials" tab
7. Click "Create Credentials" > "API Key"
8. Copy the API key (it starts with "AIza...")

## Step 2: Update the Code

Replace `YOUR_API_KEY` in `src/AppSimpleChat.tsx` with your actual API key:

```typescript
// Find this line in the code:
script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry&callback=initMap`;

// Replace with:
script.src = `https://maps.googleapis.com/maps/api/js?key=AIza...YOUR_ACTUAL_KEY&libraries=geometry&callback=initMap`;
```

## Step 3: Enable Billing (Important!)

- Google Maps API requires billing to be enabled
- You get $200 free credit per month
- Enable billing in Google Cloud Console
- Set up budget alerts to avoid unexpected charges

## Alternative: Use Demo Mode

For testing without an API key, I can create a demo mode that shows a simulated map interface.

## Current Implementation

The app is set up to:
1. Load Google Maps JavaScript API
2. Initialize map when API is ready
3. Display drone positions on real map
4. Show loading state while API loads
5. Handle map controls (zoom, pan, reset)

## Security Notes

- Never expose API keys in client-side code in production
- Consider using environment variables for API keys
- Implement rate limiting for production use

## Features Ready

✅ Map container with loading state
✅ Zoom controls (+/- buttons)
✅ Coordinate display (lat/lng)
✅ Drone position overlays
✅ Interactive drone selection
✅ Reset view functionality
✅ Professional loading indicator

## Support

If you need help:
1. Getting API key
2. Setting up billing
3. Testing the implementation
4. Troubleshooting map issues

Let me know when you have your API key and I'll help you integrate it!
