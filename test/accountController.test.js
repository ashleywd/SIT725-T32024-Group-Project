const { getAccountDetails } = require('../controllers/accountController');
const UserModel = require('../models/user');

describe('getAccountDetails Controller', () => {
    const mockRequest = (userId) => ({ userId });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn();
        return res;
    };

    afterEach(() => {
        jest.clearAllMocks(); // Clear mock data after each test
    });

    it('should return user details successfully', async () => {
        // Arrange
        const mockUser = { name: 'John Doe', email: 'john@example.com', points: 100 };
        jest.spyOn(UserModel, 'findById').mockImplementation((id) => {
            if (id === '12345') {
                return Promise.resolve(mockUser); // Simulate a valid user
            }
            return Promise.resolve(null); // Simulate user not found
        });


        const req = mockRequest('12345');
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(UserModel.findById).toHaveBeenCalledWith('12345');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'john@example.com',
            points: 100,
        });
    });

    it('should return 404 if user is not found', async () => {
        // Arrange
        jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

        const req = mockRequest('12345');
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 on internal server error', async () => {
        // Arrange
        jest.spyOn(UserModel, 'findById').mockRejectedValue(new Error('Database error'));

        const req = mockRequest('12345');
        const res = mockResponse();

        // Act
        await getAccountDetails(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});