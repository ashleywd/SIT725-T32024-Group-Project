const { getAccountDetails } = require('../controllers/accountController');
const UserModel = require('../models/user');

describe('getAccountDetails Controller', () => {
    const mockRequest = (userId) => ({ userId });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockImplementation((code) => {
            res.statusCode = code; // Capture the status code
            return res; // Enable chaining
        });
        res.json = jest.fn(); // Mock json method
        return res;
    };

    afterEach(() => {
        jest.clearAllMocks(); // Clear mock data after each test
    });

    it('should return user details successfully', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567'; // Valid ObjectId format
        const mockUser = { username: 'John Doe', email: 'john@example.com', points: 100 };
        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);

        const req = mockRequest(validUserId);
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(UserModel.findById).toHaveBeenCalledWith(validUserId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'john@example.com',
            points: 100,
        });
    });

    
    it('should return 400 for an empty userId', async () => {
        // Arrange
        const emptyUserId = ''; // Empty string
        const req = mockRequest(emptyUserId);
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400); // Expect 400 Bad Request
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid userId format' });
    });


    it('should return 400 if user is null', async () => {
        // Arrange
        const nullUserId = null;
        const req = mockRequest(nullUserId);
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid userId format' });
    });

    it('should return 400 if userId is undefined', async () => {
        // Arrange
        const req = mockRequest(undefined); // Undefined userId
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400); // Expect 400 Bad Request
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid userId format' }); // Error message matches
    });

    it('should return 500 on internal server error', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        jest.spyOn(UserModel, 'findById').mockRejectedValue(new Error('Database error'));

        const req = mockRequest(validUserId);
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should return 400 for an invalid userId format', async () => {
        // Arrange
        const req = mockRequest('invalidUserId'); // Invalid format
        const res = mockResponse();

        await getAccountDetails(req, res);

        // Assert
        expect(res.statusCode).toBe(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid userId format' });
    });

});