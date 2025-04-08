# GitHub Copilot Instructions for Trackr Mobile App

## Project Overview
Trackr is a mobile application built with Expo and React Native for tracking and managing manga reading progress.

## Coding Guidelines

### General
- Follow TypeScript best practices and strong typing
- Comment in English
- Use camelCase for variables and functions
- Use PascalCase for components and types
- Maintain a consistent structure across similar files
- Optimize for mobile performance

### Component Structure
- React functional components with hooks
- Import statements at the top, organized by:
    1. React/React Native imports
    2. Third-party libraries
    3. Local components
    4. Styles/Constants/Utils

### Styling
- Use React Native StyleSheet for component styles
- Theme colors should be accessed via the ThemeContext
- Support light/dark mode through theming

### State Management
- Use React Context for global state
- Use local component state for UI-specific state
- Prefer useState and useReducer hooks for state management

### Navigation
- React Navigation is used for app navigation
- Stack-based navigation for main flows
- Tab-based navigation for main sections

## Project Structure
- `/components`: Reusable UI components
- `/screens`: App screens
- `/contexts`: React context providers
- `/types`: TypeScript type definitions
- `/utils`: Utility functions
- `/assets`: Static assets like images and fonts

## Common Tasks
- Implement responsive layouts using Dimensions
- Handle API calls with proper loading and error states
- Support offline functionality where applicable
- Optimize list rendering with FlatList and pagination

## Testing
- Write unit tests for utility functions
- Test components with React Native Testing Library
- Ensure accessibility support

## Performance Considerations
- Memoize expensive calculations with useMemo
- Use useCallback for callback functions passed to child components
- Implement virtualized lists for long scrollable content
- Optimize image loading and caching

## Accessibility
- Use proper semantic elements
- Support screen readers
- Ensure adequate touch target sizes (minimum 44×44 points)
- Provide proper contrast ratios