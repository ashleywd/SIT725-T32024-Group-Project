# BabySwap - Community Babysitting Exchange

## Project Description
BabySwap is a web application developed for SIT725 (T3 2024) that enables parents to exchange babysitting services using a points-based system. Parents can offer their time for babysitting in exchange for points, which they can then use when they need babysitting services themselves.

## Features
 - User registration and authentication
 - Create and view babysitting posts
 - Accept babysitting requests
 - Simple points-based exchange system

## Technologies
- Backend: Node.js with Express
- Database: MongoDB
- Frontend: HTML, CSS, JavaScript, Materialize CSS
- Unit Test: Jest
- E2E Test: Playwright

## Prerequisites
- Node.js version 22
- MongoDB installed and running

## Installation & Setup
### Clone Repository

```console
git clone https://github.com/ashleywd/SIT725-T32024-Group-Project.git
cd SIT725-T32024-Group-Project
```

### Install Dependencies

```console
npm install
```

### Environment Setup
Create .env file in the root directory following same format as .env.example:

```console
SESSION_SECRET=replace-with-your-secret
MONGODB_URI=mongodb://localhost:27017/your_database
PORT=3000
```
### Start Server

```console
npm run start
```
Access application at http://localhost:3000

### Unit Tests
```console
npm run test
```

### E2E Tests
#### Prerequisites:
- Application running on port 3000
- MongoDB running
- A test user already stored in the DB
  - username: testuser1
  - password: 123456

```console
npm run E2E:ui // To initialize UI
or
npm run E2E:test // To run test in the background
and
npm run E2E:report // To display report in the browser
```

### Docker
To containerize the app, we are creating the base image using the Dockerfile.
Additionally, we use Docker Compose to create two containers: one for MongoDB and another for the app.

```console
docker compose up --build
docker compose down
```

## Development Team
[Suppressed for Privacy]

## Project Status
Development in progress for SIT725 - Applied Software Engineering (T3 2024)
