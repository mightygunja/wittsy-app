# Wittz Landing Page for Netlify

This is a simple landing page that handles deep linking for the Wittz mobile app.

## Setup Instructions

1. **Connect to Netlify:**
   - Log in to your Netlify account
   - Click "Add new site" → "Import an existing project"
   - Connect to your Git repository (or drag and drop the `netlify-site` folder)

2. **Configure Domain:**
   - In Netlify site settings, go to "Domain management"
   - Add custom domain: `wittsy.app`
   - Follow Netlify's instructions to update your DNS settings

3. **Deploy:**
   - Netlify will automatically deploy from the `public` folder
   - The `netlify.toml` file configures redirects for `/room/*` paths

## How It Works

When users click an invite link like `https://wittsy.app/room/abc123xyz`:

1. **Page loads** and extracts the room ID from the URL
2. **Displays room code** prominently for manual entry
3. **Attempts to open app** using the `wittsy://` custom scheme
4. **Shows fallback options** after 2 seconds:
   - "Open Wittz App" button
   - App Store / Google Play links (based on device)
   - Manual join instructions with room code

## Files

- `public/index.html` - Landing page with deep linking logic
- `netlify.toml` - Netlify configuration for redirects
- `README.md` - This file

## Testing

After deployment, test with:
- `https://wittsy.app/room/test123`

The page should:
- Show room code "TEST12"
- Attempt to open the app
- Show download links if app not installed
