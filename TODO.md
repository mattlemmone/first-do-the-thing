# TV Control System Implementation Plan

## Phase 1: MVP - LG TV Control

### 1. Project Setup

- [x] Initialize Node.js project with TypeScript
- [x] Set up project structure (src, tests, config folders)
- [x] Configure ESLint, Prettier, and TypeScript
- [x] Set up Jest for testing
- [x] Create initial package.json with dependencies (Express, lgtv2, etc.)
- [x] Create README.md
- [x] Create .env.example for configuration

### 2. Core Architecture

- [x] Design and implement Command interface/abstract class
- [x] Create CommandDispatcher module
- [x] Implement configuration loader for device settings
- [x] Set up logging system

### 3. LG TV Control Module

- [x] Create LGTVCommand class implementing Command interface
- [x] Implement connection handling to LG TV
- [x] Add turnOff command
- [x] Implement error handling and retries
- [x] Add disconnect/cleanup functionality

### 4. API Layer

- [x] Set up Express server
- [x] Create endpoint for triggering commands
- [x] Implement input validation
- [x] Add error handling middleware
- [x] Create basic response formatting
- [x] Add status endpoint to check system state

### 5. Testing

- [x] Write unit tests for CommandDispatcher
- [x] Create unit tests for Things3Command
- [x] Create unit tests for Scheduler
- [x] Create unit tests for API endpoints
- [x] Test error handling scenarios
- [x] Create mocks for LG TV responses

### 6. Documentation

- [x] Document API endpoints
- [x] Create setup instructions
- [x] Document configuration options

## Phase 2: Extensibility

### 1. Plugin Architecture

- [ ] Design plugin system for command modules
- [ ] Implement dynamic loading of command modules
- [ ] Create plugin registration mechanism

## Phase 3: Integration & UI

### 1. Task Integration

- [x] Research Things 3 API integration
- [x] Implement task checking mechanism
- [x] Create scheduling system for periodic checks
- [x] Implement Things3 URL scheme integration
- [x] Implement polling for tasks with specific tag
- [x] Add TV state checking and control based on task existence
- [ ] Add support for custom tags and conditions

### 2. UI Dashboard

- [x] Design simple web UI for monitoring status
- [x] Implement configuration management via UI
- [x] Add status indicators for TV and task state
- [x] Create log viewer in admin interface
- [x] Add manual control buttons for task checking
- [x] Add "Turn Off TV" button that appears when TV is on
- [x] Create outstanding tasks section to display pending tasks
- [x] Fix system status display with proper indicators
- [x] Simplify log display by removing unnecessary filtering

## Current Progress

- [x] Created and tested mocks for LG TV responses
- [x] Fixed timeout issues in tests
- [x] All tests are now passing without warnings
- [x] Implemented scheduler for periodic task checking
- [x] Added TV state detection by attempting connection
- [x] Implemented TV control based on task existence
- [x] Added API endpoints for manual task checking and status retrieval
- [x] Created web admin interface with status monitoring and log viewing
- [x] Added log filtering by level in admin interface
- [x] Implemented auto-refresh for status and logs
- [x] Added direct TV control from admin interface
- [x] Created API endpoint to fetch outstanding tasks
- [x] Added visual indicators for TV status
- [x] Improved error handling and user feedback

## Real-time TV Status Updates in UI

### Simpler Approach

Instead of implementing WebSockets, we can use a much simpler approach:

#### Server-Side Implementation

1. **Create a Dedicated TV Status Endpoint**
   - [x] Add a lightweight API endpoint `/api/tv/status` that only returns TV connection status
   - [x] Ensure this endpoint is optimized for quick response time
   - [x] Return minimal data (just connection status and timestamp)

#### Client-Side Implementation

1. **Implement Frequent Polling for TV Status Only**

   - [x] Add a separate, more frequent polling mechanism specifically for TV status
   - [x] Set polling interval to 2-3 seconds for TV status only
   - [x] Keep the existing 30-second interval for full status updates

2. **Update UI Based on Status Polling**
   - [x] Update only the TV status indicator when new status is received
   - [x] Toggle the "Turn Off TV" button based on status
   - [x] Add a subtle visual indicator when status changes

#### Implementation Details

##### Files Modified

1. `src/api/server.ts` - Added the new lightweight TV status endpoint
2. `src/public/js/admin.js` - Added the frequent polling for TV status
3. `src/public/css/styles.css` - Added animation for status changes

##### Benefits of This Approach

- Much simpler implementation than WebSockets
- No additional dependencies required
- Less overhead on the server
- Still provides reasonably responsive updates
- Minimal code changes required
