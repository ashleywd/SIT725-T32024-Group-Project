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
- Frontend: HTML, CSS, JavaScript
- UI: Materialize CSS

## Prerequisites
- Node.js installed
- MongoDB installed and running
- Git installed

## Dependancies
- express: Web application framework
- mongoose: MongoDB object modeling tool
- dotenv: Environment variable management
- express-session: Session management
- bcrypt: Password hashing
- path: File and directory paths utility
- materialize-css: UI framework

## Installation & Setup
### Clone Repository

```console
git clone https://github.com/ashleywd/SIT725-T32024-Group-Project.git
cd SIT725-T32024-Group-Project
```

### Install Dependencies

```console
npm install express mongoose dotenv express-session bcrypt path
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
node server.js
```
For development with auto-reload:
```npm install -g nodemon
nodemon server.js
```
Access application at http://localhost:3000

## Development Team
[Suppressed for Privacy]

## Project Status
Development in progress for SIT725 - Applied Software Engineering (T3 2024)
