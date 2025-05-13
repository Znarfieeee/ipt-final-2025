# Employee Management System Frontend

A modern, responsive React-based frontend for the Employee Management System, built with Vite and enhanced with TailwindCSS.

## Overview

This frontend application provides a user-friendly interface for:

-   Employee Management & Profiles
-   Department Organization
-   Request Processing System
-   Workflow Management
-   User Authentication

## Tech Stack

-   **Framework**: React 18
-   **Build Tool**: Vite
-   **Styling**: TailwindCSS
-   **State Management**: React Context
-   **UI Components**: ShadcnUI
-   **Icons**: React Icons
-   **Type Checking**: TypeScript

## Key Features

-   **Modern UI/UX**

    -   Responsive design
    -   Dark/Light mode support
    -   Animated components
    -   Toast notifications
    -   Loading states

-   **Employee Dashboard**

    -   Profile management
    -   Department visualization
    -   Status tracking
    -   Request management

-   **Administrative Tools**

    -   User management
    -   Department controls
    -   Request processing
    -   Workflow oversight

-   **Request System Interface**
    -   Equipment requests
    -   Leave applications
    -   Department transfers
    -   Status tracking

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API connections & fake backend
│   ├── components/       # Reusable UI components
│   ├── context/         # React Context providers
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   └── util/            # Helper utilities
├── public/              # Static assets
└── components.json      # ShadcnUI config
```

## Dependencies

```json
{
    "react": "^18.x",
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "shadcn-ui": "^1.x",
    "react-icons": "^4.x",
    "typescript": "^5.x"
}
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Development

### Prerequisites

-   Node.js (v18 or higher)
-   NPM (v9 or higher)

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Features Implementation

-   **Theme System**

    -   Dark/Light mode toggle
    -   Custom color schemes
    -   Consistent styling

-   **Component Library**
    -   Reusable UI components
    -   Form elements
    -   Data tables
    -   Modal dialogs
    -   Toast notifications

## State Management

-   React Context for global state
-   Local state with useState
-   Custom hooks for shared logic

## Authors

-   Team IPT-2025
    -   Mari Franz Espelita
    -   Eldrin Trapa

## License

This project is licensed under the MIT License - see the LICENSE file for details
