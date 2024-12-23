const { updateAccountDetails } = require('../controllers/accountController');
const UserModel = require('../models/user');

describe('updateAccountDetails Controller', () => {
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

    it('should update account details successfully', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        const updatedUser = { username: 'Jane Doe', email: 'jane@example.com', points: 100 };
        jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(updatedUser);

        const req = { userId: validUserId, body: { username: 'Jane Doe', email: 'jane@example.com' } };
        const res = mockResponse();

        // Act
        await updateAccountDetails(req, res);

        // Assert
        expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
            validUserId,
            { $set: { username: 'Jane Doe', email: 'jane@example.com' } },
            { new: true, runValidators: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Account updated successfully',
            user: updatedUser,
        });
    });

    it('should return 400 if no fields are provided for update', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        const req = { userId: validUserId, body: {} };
        const res = mockResponse();

        // Act
        await updateAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'At least one field (name or email) must be provided for update' });
    });    

    it('should return 500 on internal server error', async () => {
        // Arrange
        const validUserId = '5f50c31b8f8c7b1a6c8b4567';
        jest.spyOn(UserModel, 'findByIdAndUpdate').mockRejectedValue(new Error('Database error'));

        const req = { userId: validUserId, body: { username: 'Jane Doe' } };
        const res = mockResponse();

        // Act
        await updateAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});