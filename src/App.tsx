import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Components
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages and components
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import TicTacToe from './components/games/TicTacToe';
import Snake from './components/games/Snake';
import MemoryMatch from './components/games/MemoryMatch';
import Tetris from './components/games/Tetris';
import Pong from './components/games/Pong';
import ChessGame from './components/games/Chess/ChessGame';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import GamesPage from './pages/GamesPage';

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              // Default toast styling
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '8px',
              },
              // Custom styling for different toast types
              success: {
                style: {
                  background: 'rgba(34, 197, 94, 0.9)',
                },
                iconTheme: {
                  primary: 'white',
                  secondary: 'rgba(34, 197, 94, 0.9)',
                },
              },
              error: {
                style: {
                  background: 'rgba(239, 68, 68, 0.9)',
                },
                iconTheme: {
                  primary: 'white',
                  secondary: 'rgba(239, 68, 68, 0.9)',
                },
              },
            }}
          />
          
          <Navigation />
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                
                {/* Protected routes - require authentication */}
                <Route path="/games" element={
                  <ProtectedRoute>
                    <GamesPage />
                  </ProtectedRoute>
                } />
                <Route path="/games/tictactoe" element={
                  <ProtectedRoute>
                    <TicTacToe />
                  </ProtectedRoute>
                } />
                <Route path="/games/snake" element={
                  <ProtectedRoute>
                    <Snake />
                  </ProtectedRoute>
                } />
                <Route path="/games/memory" element={
                  <ProtectedRoute>
                    <MemoryMatch />
                  </ProtectedRoute>
                } />
                <Route path="/games/tetris" element={
                  <ProtectedRoute>
                    <Tetris />
                  </ProtectedRoute>
                } />
                <Route path="/games/pong" element={
                  <ProtectedRoute>
                    <Pong />
                  </ProtectedRoute>
                } />
                <Route path="/games/chess" element={
                  <ProtectedRoute>
                    <ChessGame onExit={() => window.location.href = '/games'} />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
