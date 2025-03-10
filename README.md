# First Do The Thing

A TV control system that disables an LG TV when tasks aren't completed. This project uses the lgtv2 Node.js library to send commands to an LG TV and integrates with Things 3 to check for incomplete tasks.

## Features

- Turn off LG TV via API
- Things 3 integration to check for tasks with specific tags
- Automatic scheduling of task checks
- Extensible command dispatch system for future integrations
- REST API for triggering commands

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

## API Endpoints

- `POST /api/command` - Trigger a command
  - Request body: `{ "protocol": "lgtv", "command": "turnOff", "config": { "ip": "192.168.1.X" } }`
- `GET /api/check-things3` - Check Things 3 tasks and turn off TV if tasks with the specified tag exist

## Configuration

Configure your settings in the `.env` file:

```
# Server Configuration
PORT=3000

# LG TV Configuration
TV_IP=192.168.1.100
TV_PORT=3001
TV_KEY=your_tv_key

# Things 3 Configuration
THINGS3_TAG=tv-blocker
THINGS3_CHECK_INTERVAL=300000
```

### Things 3 Integration

The system checks for tasks in Things 3 with a specific tag (default: `tv-blocker`). If any tasks with this tag are found, the TV will be turned off.

The check is performed:

1. On application startup
2. At regular intervals (configurable via `THINGS3_CHECK_INTERVAL` in milliseconds)
3. When manually triggered via the `/api/check-things3` endpoint

## License

ISC
