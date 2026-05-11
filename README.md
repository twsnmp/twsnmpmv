# TWSNMP Map Viewer (twsnmpmv)

[日本語](./README_ja.md)

TWSNMP Map Viewer is a mobile and web application designed to provide a portable visualization of network status managed by [TWSNMP](https://github.com/twise-oss/twsnmpfk). It allows users to monitor multiple TWSNMP sites, view network maps, and track the status of nodes and pollings in real-time.

## Features

- **Multi-site Support:** Monitor multiple TWSNMP instances simultaneously.
- **Interactive Network Map:** Visualize your network layout with nodes, lines, and status indicators.
- **Real-time Status Updates:** Periodically fetches status from configured sites.
- **Status Visualization:** Color-coded status (Normal, Warning, Low, High) and icons for quick identification.
- **Mobile Friendly:** Built with Capacitor for a seamless mobile experience.

## Technology Stack

- **Frontend:** [Svelte](https://svelte.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Visualization:** [p5.js](https://p5js.org/) for the network map
- **Mobile Platform:** [Capacitor](https://capacitorjs.com/)
- **Styling:** Vanilla CSS with [Tailwind CSS](https://tailwindcss.com/) (partially)
- **API Communication:** Fetch API with JWT authentication

## Architecture Overview

The application follows a simple store-based architecture:

- **DataStore (`src/lib/datastore.ts`):** The central hub for managing application state, including the list of TWSNMP sites and their current status. It persists data using Capacitor Preferences.
- **TwsnmpAPI (`src/lib/twsnmpapi.ts`):** A wrapper for interacting with the TWSNMP REST API.
- **Map Library (`src/lib/map.ts`):** A specialized library using p5.js to render the network map and handle user interactions like zooming.
- **Svelte Components:** The UI layer, organized into reusable components in `src/lib/`.

## Getting Started

### Prerequisites

- [mise](https://mise.jdx.dev/) (recommended for managing tools and tasks)
- Node.js (managed by mise)
- Java OpenJDK 21 (managed by mise)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/twise-oss/twsnmpmv.git
   cd twsnmpmv
   ```

2. Install tools and dependencies:
   ```bash
   mise install
   npm install
   ```

### Development

Start the development server:

```bash
mise run dev
```

Run tests:

```bash
mise run test
```

### Building and Running

This project uses `mise` to orchestrate build and synchronization tasks for web and mobile platforms.

#### Web Production Build
```bash
mise run build
```

#### Android
- **Debug on Emulator:**
  ```bash
  mise run debug:android
  ```
- **Build Release APK:**
  ```bash
  mise run release:android
  ```

#### iOS
- **Debug on Simulator:**
  ```bash
  mise run debug:ios
  ```
- **Build Release:**
  ```bash
  mise run release:ios
  ```

#### Full Release (Both Platforms)
```bash
mise run release
```

## Documentation

- [Architecture Decision Records (ADRs)](docs/decisions/)
- [API Documentation](docs/api.md)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
