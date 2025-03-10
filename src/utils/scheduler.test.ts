import { Scheduler } from './scheduler';
import { CommandDispatcher } from '../commands/CommandDispatcher';

// Mock the CommandDispatcher
jest.mock('../commands/CommandDispatcher');

// Mock the logger
jest.mock('./logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock the config
jest.mock('../config/config', () => ({
  config: {
    things3: {
      tag: 'test-tag',
      checkInterval: 300000,
    },
  },
}));

describe('Scheduler', () => {
  let scheduler: Scheduler;
  let mockCommandDispatcher: jest.Mocked<CommandDispatcher>;
  let originalSetInterval: typeof global.setInterval;
  let originalClearInterval: typeof global.clearInterval;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Save original timer functions
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    
    // Mock setInterval and clearInterval
    global.setInterval = jest.fn().mockReturnValue(123) as any;
    global.clearInterval = jest.fn() as any;
    
    // Create a mock CommandDispatcher
    mockCommandDispatcher = new CommandDispatcher() as jest.Mocked<CommandDispatcher>;
    mockCommandDispatcher.dispatchCommand = jest.fn().mockResolvedValue({
      success: true,
      message: 'Command executed successfully',
    });
    
    // Create a Scheduler instance with the mock CommandDispatcher
    scheduler = new Scheduler(mockCommandDispatcher);
  });
  
  afterEach(() => {
    // Restore original timer functions
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });
  
  test('should start the scheduler and perform initial check', () => {
    scheduler.start();
    
    // Verify that dispatchCommand was called for the initial check
    expect(mockCommandDispatcher.dispatchCommand).toHaveBeenCalledWith(
      'things3',
      'checkTasks',
      { tag: 'test-tag' }
    );
    
    // Verify that setInterval was called with the correct interval
    expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 300000);
  });
  
  test('should perform periodic checks', async () => {
    // Create a spy on the checkThings3Tasks method
    const checkTasksSpy = jest.spyOn(scheduler as any, 'checkThings3Tasks');
    
    scheduler.start();
    
    // Clear the initial call
    jest.clearAllMocks();
    mockCommandDispatcher.dispatchCommand.mockClear();
    
    // Directly call the private method to simulate a periodic check
    await (scheduler as any).checkThings3Tasks();
    
    // Verify that the method was called
    expect(checkTasksSpy).toHaveBeenCalled();
    
    // Verify that dispatchCommand was called again
    expect(mockCommandDispatcher.dispatchCommand).toHaveBeenCalledWith(
      'things3',
      'checkTasks',
      { tag: 'test-tag' }
    );
  });
  
  test('should stop the scheduler', () => {
    scheduler.start();
    
    // Set the interval ID
    (scheduler as any).checkInterval = 123;
    
    scheduler.stop();
    
    // Verify that clearInterval was called
    expect(global.clearInterval).toHaveBeenCalledWith(123);
    
    // Verify that the interval was cleared
    expect((scheduler as any).checkInterval).toBeNull();
  });
  
  test('should handle errors during check', async () => {
    // Mock dispatchCommand to throw an error
    mockCommandDispatcher.dispatchCommand.mockRejectedValueOnce(
      new Error('Test error')
    );
    
    // Call the private method directly
    await (scheduler as any).checkThings3Tasks();
    
    // Verify that the error was logged but didn't crash the scheduler
    const logger = require('../utils/logger');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Test error'));
  });
}); 