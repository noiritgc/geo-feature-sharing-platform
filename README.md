# Map Demo

A compact but technically layered Next.js prototype for creating, organizing, and browsing map-based areas. The application combines a Leaflet map experience with Firebase Authentication and Firestore persistence for personal and group-based collections.

## What is implemented

- A client-side map experience built with Next.js, React, TypeScript, Leaflet, and react-leaflet.
- Geolocation-based map initialization, with a fallback center if location access is denied.
- Polygon drawing on the map: the user can click to place points, preview a shape, and save it to Firestore.
- Google sign-in and sign-out via Firebase Auth.
- Firestore-backed data for:
  - users and profile records
  - friends, stored under each user document
  - groups
  - polygons, linked either to a personal bucket or to a specific group
- Interactive side panels for:
  - authentication state
  - friend management (view, add by UID, copy UID)
  - a personal bucket of saved areas
  - group management and group-area browsing

## Notes

The app combines several interacting pieces in a compact codebase: auth state, Firestore collections, map interaction, and a multi-panel interface.

## Skills demonstrated

- Next.js App Router and client/server boundaries
- React hooks and state management in a single-page experience
- TypeScript interfaces and data modeling
- Firebase Auth and Firestore integration
- Leaflet map interaction via react-leaflet
- CSS Modules and component-scoped styling
- Environment-based configuration for browser-safe Firebase setup

## Project structure

- map-demo/app/page.tsx — main app shell, auth state, friends, groups, bucket, and group-area panels
- map-demo/app/MapComponent.tsx — Leaflet map, geolocation, polygon drawing, and selected-area rendering
- map-demo/app/auth.ts — Google sign-in helper
- map-demo/app/firebase.ts — Firebase app initialization, Firestore, Auth, and analytics
- map-demo/app/layout.tsx — app shell and shared layout
- map-demo/app/globals.css and map-demo/app/page.module.css — styling

## Technology stack

- Next.js 16
- React 19
- TypeScript
- Firebase Auth, Firestore, and Analytics
- Leaflet and react-leaflet
- ESLint and Next.js build tooling

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Environment variables

The app expects Firebase values exposed via NEXT_PUBLIC_ variables:

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

These values are read in map-demo/app/firebase.ts.

