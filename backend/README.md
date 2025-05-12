# Employee Management System Backend

A robust Node.js backend service for managing employee-related operations, including department management, employee records, requests, and workflows.

## Overview

This backend system serves as the core API for an Employee Management System, providing endpoints for:

-   Employee Management
-   Department Organization
-   Request Processing (Equipment, Leave, Transfer)
-   Workflow Management
-   User Authentication & Authorization

## Tech Stack

-   **Runtime Environment**: Node.js
-   **Framework**: Express.js
-   **Database**: Sequelize ORM
-   **API Type**: RESTful
-   **Input Validation**: Joi

## Key Features

-   **Department Management**

    -   Create/Update/Delete departments
    -   Track employee counts
    -   Department transfer workflows

-   **Employee Management**

    -   Employee profiles
    -   Department assignments
    -   Status tracking

-   **Request System**

    -   Equipment requests
    -   Leave applications
    -   Department transfer requests
    -   Request item tracking

-   **Workflow Management**
    -   Onboarding processes
    -   Transfer workflows
    -   Status updates
    -   Process tracking

## API Structure

```
/departments - Department management
/employees   - Employee operations
/requests    - Request handling
/workflows   - Workflow processing
```

## Dependencies

```json
{
    "express": "^4.18.x",
    "sequelize": "^6.x",
    "joi": "^17.x",
    "bcryptjs": "^2.x",
    "cors": "^2.x"
}
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure your database in `config.json`

3. Start the server:

```bash
npm start
```

## API Security

-   JWT-based authentication
-   Request validation middleware
-   Role-based authorization
-   Error handling middleware

## Middleware Stack

-   Error Handler
-   Request Validation
-   Authentication
-   Authorization
-   CORS

## Development

### Prerequisites

-   Node.js (v18 or higher)
-   NPM (v9 or higher)
-   MySQL/PostgreSQL

### Development Commands

```bash
npm run dev      # Start development server
npm test        # Run tests
npm run lint    # Check code style
```

## Project Structure

```
backend/
├── _middleware/        # Middleware functions
├── departments/        # Department routes and logic
├── employees/         # Employee management
├── requests/         # Request handling
├── workflows/        # Workflow processing
├── _helpers/         # Utility functions
├── config.json       # Configuration
└── server.js         # Application entry
```

## Error Handling

The application includes comprehensive error handling:

-   Validation errors
-   Authentication errors
-   Database errors
-   General runtime errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## Authors

-   Team IPT-2025
    -   Mari Franz Espelita
    -   Rolly Alonso
    -   Chad RV Abcede

## License

This project is licensed under the MIT License - see the LICENSE file for details
