const { getAccountPoints } = require('../controllers/accountController');
const UserModel = require('../models/user');

describe('getAccountPoints Controller', () => {
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

    it('should return points successfully', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        const mockUser = { points: 200 };
        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);

        const req = mockRequest(validUserId);
        const res = mockResponse();

        // Act
        await getAccountPoints(req, res);

        // Assert
        expect(UserModel.findById).toHaveBeenCalledWith(validUserId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ points: 200 });
    });

    it('should return 500 on internal server error', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        jest.spyOn(UserModel, 'findById').mockRejectedValue(new Error('Database error'));

        const req = mockRequest(validUserId);
        const res = mockResponse();

        // Act
        await getAccountPoints(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});
