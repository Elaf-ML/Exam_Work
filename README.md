# GamesHub

GamesHub is an interactive gaming platform featuring multiple games with user authentication, statistics tracking, and multiplayer functionality. The platform is built with a sleek design featuring a black and bright purple color scheme.

## Features

- 🎮 Five interactive games:
  - Tic Tac Toe (multiplayer)
  - Snake
  - Memory Match
  - Tetris
  - Pong (multiplayer)
- 👤 User authentication with Firebase
- 📊 Player statistics and game history tracking
- 🏆 Global leaderboards
- 🎮 Real-time multiplayer functionality
- 📱 Responsive design

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Firebase (Authentication, Firestore)
- **State Management:** React Context API
- **Multiplayer:** Firebase Realtime Database
- **Styling:** Tailwind CSS with DaisyUI components

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/gameshub.git
   cd gameshub
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Add your Firebase configuration to `src/firebase/config.ts`

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Project Structure

```
src/
  ├── components/      # Reusable components
  │   ├── auth/        # Authentication components
  │   ├── games/       # Game components
  │   └── ...
  ├── context/         # React context providers
  ├── firebase/        # Firebase configuration
  ├── pages/           # Page components
  ├── App.tsx          # Main app component
  └── main.tsx         # Entry point
```

## Game Implementation

Each game has its own component in the `src/components/games/` directory. Games include:

- **Tic Tac Toe:** Classic game with multiplayer support
- **Snake:** Navigate a snake to eat food while avoiding walls and itself
- **Memory Match:** Match pairs of cards in the shortest time
- **Tetris:** Arrange falling blocks to clear lines
- **Pong:** Classic paddle game with multiplayer support

## Multiplayer Functionality

Multiplayer games (Tic Tac Toe and Pong) use Firebase Realtime Database to sync game state between players. Players can generate an invite code to share with friends for multiplayer sessions.

## Firebase Implementation

The app uses Firebase for:
- **Authentication:** User registration and login
- **Firestore:** Storing user profiles and game statistics
- **Realtime Database:** Managing multiplayer game sessions

## Styling

The app uses Tailwind CSS with a custom theme defined in `tailwind.config.js`. The color scheme is primarily black and bright purple, with smooth animations provided by Framer Motion.

## License

This project is licensed under the MIT License.
