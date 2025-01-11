const socketController = require("../controllers/socketController");

describe("socketController", () => {
    describe("handleConnection", () => {
        it("should join the correct room based on userId", () => {
            // Mock socket object
            const socket = {
                request: { userId: "user123" }, // Mocked userId
                join: jest.fn(), // Mock the join method
            };

            // Call the function
            socketController.handleConnection(socket);

            // Assertions
            expect(socket.join).toHaveBeenCalledWith("user123");
        });

        it("should handle missing userId gracefully", () => {
            // Mock socket object with missing userId
            const socket = {
                request: {}, // No userId in request
                join: jest.fn(),
            };

            // Call the function
            socketController.handleConnection(socket);

            // Assertions
            // Verify that socket.join was called with undefined, not an actual userId
            expect(socket.join).toHaveBeenCalledWith(undefined);
        });
    });
});
