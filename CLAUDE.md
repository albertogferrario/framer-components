# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Framer components library containing custom React components designed for use in Framer projects. Components are built with TypeScript and leverage Framer's property controls for visual editing.

## Architecture

### Component Structure
- Each component lives in its own directory at the root level
- Components export Framer property controls via `addPropertyControls`
- All components use React functional components with hooks
- Direct DOM manipulation is used for performance-critical operations

### Key Components

**PerpetualSlider** (`perpetual-slider/PerpetualSlider.tsx`)
- Infinite scroll implementation with array replication
- Global scroll event interception
- Supports horizontal/vertical scrolling with masking

**Physics** (`physics/Physics.tsx`)
- Matter.js physics engine integration
- Creates physics bodies from child elements
- Mouse/touch interaction with configurable physics properties

**ScrollSection** (`scroll-section/ScrollSection.tsx`)
- Intersection Observer-based viewport detection
- Hash navigation support
- Custom event system for programmatic scrolling

## Development Patterns

### Framer Property Controls
All components must export property controls:
```typescript
addPropertyControls(ComponentName, {
    propertyName: {
        type: ControlType.Type,
        title: "Property Title",
        defaultValue: defaultValue,
    }
})
```

### Event Handling
- Use passive event listeners for scroll/touch events
- Clean up event listeners in useEffect return functions
- Global events should check if they need to intercept (see PerpetualSlider)

### Performance Considerations
- Use `requestAnimationFrame` for animations
- Implement proper cleanup in `useEffect` hooks
- Avoid unnecessary re-renders with proper dependency arrays

## Common Tasks

### Testing Components in Framer
Components are tested directly in Framer by:
1. Copying the component file to a Framer project
2. Using the visual property controls to configure
3. Testing interactions in preview mode

### Adding a New Component
1. Create a new directory at root level
2. Create ComponentName.tsx file
3. Implement component with Framer property controls
4. Follow existing patterns for event handling and lifecycle

## Important Notes

- No traditional build system - Framer handles compilation
- No package.json - dependencies are managed by Framer
- Components should be self-contained with minimal external dependencies
- Always include proper TypeScript types for refs and events
- Use Framer's `@framerSupportsLayoutId` annotation for layout animations