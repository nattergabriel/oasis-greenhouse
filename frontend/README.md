# Frontend

This directory contains the frontend application.

## Getting Started

1. **Choose your framework** and initialize it here:
   ```bash
   # Examples:
   npx create-next-app@latest .
   npx create-vite@latest . -- --template react-ts
   flutter create .
   ```

2. **Install dependencies:**
   ```bash
   # Add your install command
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Fill in the values
   ```

4. **Run the dev server:**
   ```bash
   # Add your run command
   ```

## Structure

Organize however your framework suggests. At minimum:
- Pages / screens for each route
- API client module that matches `contracts/API.md`
- Shared components (buttons, inputs, layout)

## Notes

- Build against mocked data first so you're not blocked by the backend
- Keep the API client in one place — makes switching from mocks to real API easy
- See `contracts/API.md` for the agreed endpoint definitions
