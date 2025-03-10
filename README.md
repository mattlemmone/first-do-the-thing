# First Do The Thing

A TV control system that disables an LG TV when tasks aren't completed. This project uses the lgtv2 Node.js library to send commands to an LG TV and integrates with Things 3 to check for incomplete tasks.

## Features

- Turn off LG TV via API
- Things 3 integration to check for tasks with specific tags
- Automatic scheduling of task checks
- Real-time TV status monitoring (independent from task checking)
- Extensible command dispatch system for future integrations
- REST API for triggering commands
- Web admin interface for monitoring and control

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and update with your TV's IP address, key, and Things 3 configuration
4. Build the project:
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

The admin interface automatically refreshes every 30 seconds to show the latest information.

To access the admin interface, open your browser and navigate to:

```
http://localhost:3000
```

(Replace 3000 with your configured port if different)

## API Endpoints

- `POST /api/check-tasks` - Manually trigger a task check and TV control
- `GET /api/status` - Get the current status of the system
- `GET /api/logs` - Get system logs
- `GET /api/tasks` - Get outstanding tasks with the configured tag
- `POST /api/tv/turn-off` - Directly turn off the TV

## License

ISC
