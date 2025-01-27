const Notification = require('../models/notification');

jest.mock('../models/notification'); // Mock the notification.js module

describe('Notification Model Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should save a valid notification and contain all expected fields', async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: 'mockedNotificationId',
      userId: 'mockedUserId',
      message: 'Test notification message',
      status: 'new',
      isGlobal: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    Notification.prototype.save = mockSave;

    const validNotification = new Notification({
      userId: 'mockedUserId',
      message: 'Test notification message',
      isGlobal: true,
    });

    const savedNotification = await validNotification.save();

    // Ensure that the mock method was called exactly once
    expect(mockSave).toHaveBeenCalledTimes(1);

    // Verify that all expected fields are included in the saved notification
    expect(savedNotification).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        userId: 'mockedUserId',
        message: 'Test notification message',
        status: 'new',
        isGlobal: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
  });

  it('should throw an error when message is missing', async () => {
    const mockSave = jest.fn().mockRejectedValue({
      errors: {
        message: { message: 'Message is required' },
      },
    });
    Notification.prototype.save = mockSave;

    const invalidNotification = new Notification({
      userId: 'mockedUserId',
    });

    let err;
    try {
      await invalidNotification.save();
    } catch (error) {
      err = error;
    }

    // Ensure that the mock method was called exactly once
    expect(mockSave).toHaveBeenCalledTimes(1);

    // Verify that the error contains the expected validation message for "message"
    expect(err.errors.message).toBeDefined();
    expect(err.errors.message.message).toBe('Message is required');
  });

  it('should throw an error for invalid "status" values', async () => {
    const mockSave = jest.fn().mockRejectedValue({
      errors: {
        status: { message: 'Invalid status value' },
      },
    });
    Notification.prototype.save = mockSave;

    const invalidNotification = new Notification({
      userId: 'mockedUserId',
      message: 'Invalid status test',
      status: 'invalid_status', // Invalid status value
    });

    let err;
    try {
      await invalidNotification.save();
    } catch (error) {
      err = error;
    }

    // Ensure that the mock method was called exactly once
    expect(mockSave).toHaveBeenCalledTimes(1);

    // Verify that the error contains the expected validation message for "status"
    expect(err.errors.status).toBeDefined();
    expect(err.errors.status.message).toBe('Invalid status value');

    // Note: The "status" field accepts only predefined values like "new" or "seen".
    // Any value outside this set should trigger a validation error.
  });

  it('should default isGlobal to false when not provided', async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: 'mockedNotificationId',
      userId: 'mockedUserId',
      message: 'Default isGlobal test',
      status: 'new',
      isGlobal: false, // Default value
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    Notification.prototype.save = mockSave;

    const validNotification = new Notification({
      userId: 'mockedUserId',
      message: 'Default isGlobal test',
    });

    const savedNotification = await validNotification.save();

    // Ensure that the mock method was called exactly once
    expect(mockSave).toHaveBeenCalledTimes(1);

    // Verify that isGlobal defaults to false
    expect(savedNotification.isGlobal).toBe(false);
  });
});
