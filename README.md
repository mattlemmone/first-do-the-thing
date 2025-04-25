# First Do The Thing

A productivity enforcement system that automatically turns off your LG TV when you have incomplete tasks in Things 3. Perfect for those who need a little extra motivation to complete their to-do list before relaxing with TV time.

![CleanShot 2025-03-10 at 12 39 49@2x](https://github.com/user-attachments/assets/6791bc67-9a14-453e-a649-d0f32b2aed57)

![CleanShot 2025-03-10 at 12 40 17@2x](https://github.com/user-attachments/assets/85ce0dc5-f1c7-48b3-bb19-548e67edf904)


## How It Works

1. The system periodically checks Things 3 for tasks with a specific tag (default: "do the thing")
2. If any tagged tasks exist, and your LG TV is on, it will automatically turn off your TV

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- An LG WebOS TV with network connectivity
- Things 3 app (for task integration)
- macOS (required for Things 3 integration)

## Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/first-do-the-thing.git
   cd first-do-the-thing
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Copy `.env.example` to `.env` and update with your configuration:

   ```
   cp .env.example .env
   ```

4. Obtain your LG TV key:

   ```
   node scripts/get-tv-key.js
   ```

   Follow the on-screen instructions to authorize the application on your TV.

5. Update your `.env` file with the obtained TV key.

6. Build the project:
   ```
   npm run build
   ```

## Usage

Start the server:

```
npm start
```

For development with auto-reload:

```
npm run dev
```

### Utility Scripts

- `scripts/get-tv-key.js` - Get the client key for your LG TV

## Configuration

The application can be configured using environment variables in the `.env` file:

| Variable                 | Description                          | Default      |
| ------------------------ | ------------------------------------ | ------------ |
| PORT                     | Server port                          | 3000         |
| TV_IP                    | IP address of the LG TV              | -            |
| TV_PORT                  | WebSocket port for the TV            | 3001         |
| TV_KEY                   | Client key for TV authentication     | -            |
| TV_STATUS_CHECK_INTERVAL | Interval for checking TV status (ms) | 10000        |
| THINGS3_TAG              | Tag to search for in Things 3        | do the thing |
| THINGS3_CHECK_INTERVAL   | Interval for checking tasks (ms)     | 300000       |

## Web Admin Interface

The application includes a web-based admin interface that allows you to:

- View the current system status with visual indicators
- See outstanding tasks from Things 3
- Check tasks manually
- Turn off the TV directly (when it's on)
- Monitor system logs in real-time

The admin interface automatically refreshes every 30 seconds to show the latest information, with TV status updating more frequently (every 2-3 seconds).

To access the admin interface, open your browser and navigate to:

```
http://localhost:3000
```

## API Endpoints

- `POST /api/check-tasks` - Manually trigger a task check and TV control
- `GET /api/status` - Get the current status of the system
- `GET /api/logs` - Get system logs
- `GET /api/tasks` - Get outstanding tasks with the configured tag
- `POST /api/tv/turn-off` - Directly turn off the TV
- `GET /api/tv/status` - Get the current TV connection status

## Recent Updates

### TV Connection Status Improvements

- Fixed an issue where the system would incorrectly report the TV as connected when it was physically turned off
- Added a heartbeat mechanism to verify the TV is actually responsive
- Improved state management with immutable updates and event emitters
- Enhanced error handling for more reliable TV control
