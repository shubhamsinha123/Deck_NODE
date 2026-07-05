# API Connect

A modular Node.js Express backend service refactored using the **SOLID Design Principles** and the **Controller-Service-Model** architectural pattern. Fully typed, lint-checked, and covered by a comprehensive Jest unit test suite.

---

## 🚀 Features

- **Layered Architecture**: Decoupled routes, controllers, business services, and database models.
- **Robust Exception Handling**: Global error catching middleware powered by custom extending exceptions (`AppError`).
- **Comprehensive Testing**: 97 mocked unit tests using **Jest**.
- **ESLint Configured**: Enforces Airbnb style guidelines for high code quality.
- **Docker Ready**: Ready to be containerized and deployed.

---

## 📁 Directory Structure

```
api_connect/
├── src/
│   ├── config/          # Centralized Database and App configuration settings
│   ├── constants/       # HTTP status codes and standard API error messages
│   ├── controllers/     # Controller layer (handles HTTP requests/responses)
│   ├── exceptions/      # Custom application exceptions (e.g. AppError)
│   ├── middleware/      # Authentication & Error handler middlewares
│   ├── models/          # Clean Mongoose database model definitions
│   ├── services/        # Service layer (contains core business logic)
│   ├── utils/           # Validation and utility helpers
│   └── App.js           # Server application mounting root controller routes
├── tests/
│   └── unit/            # Domain-specific Jest unit tests
├── server.js            # Main entry point bootstrapping database & server ports
├── SOLID.md             # Detailed SOLID principles compliance document
└── README.md            # Project overview & running instructions
```

---

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd api_connect
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (Git will automatically ignore it):
   ```env
   MONGODB_URI="your-mongodb-connection-string"
   PORT=5000
   ```

---

## ⚡ Available Scripts

In the project directory, you can run the following scripts:

### Run in Development Mode
Launches the server with `nodemon` for auto-reloading:
```bash
npm run dev
```

### Run in Production Mode
Starts the application using standard `node`:
```bash
npm start
```

### Run Tests
Executes the Jest unit tests suite (runs in band with open-handles detection):
```bash
npm test
```

### Run Linter
Validates style, syntax, and formatting constraints across source files:
```bash
npm run lint
```
---

# OpenAPI Documentation

For creating or validating the OpenAPI (Swagger) specification, refer to:

- Swagger Editor: http://editor.swagger.io/
- Jira Story: https://deck-digital.atlassian.net/browse/DD-72

> **Note:** You can either get API spec from docs folder from `master` repo or from the jira comments.

> **Note:** Open and copy the API spec as its there as `.yaml` file and check more details by pasting it over `swagger editor` app.

> **Note:** Ensure the OpenAPI specification is updated whenever new APIs are added or existing APIs are modified. Keep the documentation in sync with the application code.

---

## 🐳 Docker Deployment

To build and run the application inside a Docker container:

### Build Docker Image
```bash
docker build -t api_connect .
```

### Check Built Images
```bash
docker images
```

### Run Docker Container
```bash
docker run -p 5000:5000 --env-file .env api_connect
```