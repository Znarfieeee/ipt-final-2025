# Backend Mode Switching Guide

This document explains how to manually switch between real and fake backend modes in the application.

## Background

The application supports two backend modes:

1. **Real Backend Mode**: Connects to the actual server API
2. **Fake Backend Mode**: Uses in-memory mock data for testing and development

## How to Switch Modes

### Method 1: Browser Console

1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the Console tab
3. Type one of these commands:
    - To use fake backend: `window.USE_FAKE_BACKEND = true`
    - To use real backend: `window.USE_FAKE_BACKEND = false`
4. The page will automatically refresh after 1 second

### Method 2: Local Storage

1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the Application tab
3. Select "Local Storage" in the sidebar
4. Find or create the key: `useFakeBackend`
5. Set its value to:
    - `"true"` (including quotes) for fake backend
    - `"false"` (including quotes) for real backend
6. Refresh the page manually

## Checking Current Mode

To check which mode you're currently using:

1. Open the browser console
2. Type: `window.USE_FAKE_BACKEND`
3. The console will show `true` for fake mode or `false` for real mode

## Notes

-   The backend mode is stored in your browser's local storage
-   It persists between sessions until you change it
-   If the real backend is unavailable, the application might automatically fall back to fake mode
