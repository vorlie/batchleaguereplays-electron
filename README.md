# Batch League Replays

A single-window, desktop-based League of Legends application designed to efficiently fetch, browse, and batch-download match history replays directly through the local League Client (LCU). Built as a modern Node.js and Electron project.

## Features

* **Direct LCU Integration:** Interfaces smoothly with your locally running League Client via its internal Local API, sidestepping the strict rate limits and API key requirements of standard Riot Developer integrations.
* **Match History Viewer:** View historical games, review participant statistics, and parse game data visually.
* **Native Match Downloading:** Triggers the native match download API inside the League Client for any given game ID.
* **Data Dragon Syncing:** Automatically retrieves the latest local Data Dragon asset patches, ensuring accurate representation of champion names and badges locally without requiring hardcoded metadata dictionaries.
* **Intelligent Auto-Updating:** Features seamless application updates handled silently via the `electron-updater` package.

## Development

The application relies on Node.js and React packaged within Vite.

### Getting Started

Install dependencies:
```bash
npm install
```

Run in development mode (hot-reloads both Vite backend and Electron UI layer simultaneously):
```bash
npm run dev
```

### Packaging

To build the application and compile the installer executable:
```bash
npm run build
```

## Important Limitations

### Client Patch Restrictions
Replay downloads triggered via this application (or via the League Client natively) are strictly limited to the current live game patch. If the League of Legends server receives a patch update, you will no longer be able to download replays from matches played on any previous patches. Attempting to target an older Game ID will result in the client failing the download gracefully.

### Riot API Match History Quirk
The current League Client endpoint (`/lol-match-history/v1/products/lol/current-summoner/matches`) fetches from the locally cached game record inside your client rather than polling an uncached Riot server. As a result of Riot's background architecture:
* Upon initially opening your League Client, a standard query may max out at yielding exactly 20 matches.
* This endpoint actively ignores traditional API pagination limiters (e.g., `begIndex` and `endIndex`). 
* If you desire to load a deeper history (up to roughly 100 matches), you must manually trigger the client to cache these entries. Based on theoretical observation, actions such as navigating into your Match History tab within the League Client UI and scrolling downward, or launching a Practice Tool game, may force a profile synchronization that caches the remaining historical matches. There might be other unknown triggers as well. Clicking 'Fetch' in this app afterwards will then retrieve whatever the client has natively pooled.
