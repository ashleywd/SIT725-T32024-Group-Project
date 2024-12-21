const { deleteAccount } = require('../controllers/accountController');
const UserModel = require('../models/user');

describe('deleteAccount Controller', () => {
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

    it('should delete account successfully', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        jest.spyOn(UserModel, 'findByIdAndDelete').mockResolvedValue({ id: validUserId });

        const req = mockRequest(validUserId);
        const res = mockResponse();

        // Act
        await deleteAccount(req, res);

        // Assert
        expect(UserModel.findByIdAndDelete).toHaveBeenCalledWith(validUserId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted successfully' });
    });

    it('should return 400 for invalid userId format', async () => {
        // Arrange
        const invalidUserId = 'invalidUserId';
        const req = mockRequest(invalidUserId);
        const res = mockResponse();

        // Act
        await deleteAccount(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid userId format' });
    });
    
    it('should return 500 on internal server error', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        jest.spyOn(UserModel, 'findByIdAndDelete').mockRejectedValue(new Error('Database error'));

        const req = mockRequest(validUserId);
        const res = mockResponse();

        // Act
        await deleteAccount(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});
