import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Cookie name constant
const AUTH_COOKIE_NAME = 'gameshub_auth_token';
// Cookie expiration in days
const COOKIE_EXPIRATION = 7;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Set JWT token in cookie
  const setAuthCookie = (user: User) => {
    // Generate a simple token using user UID and current timestamp
    // In a production app, you would use a proper JWT library
    const token = btoa(JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      timestamp: new Date().getTime()
    }));
    
    // Set the cookie
    Cookies.set(AUTH_COOKIE_NAME, token, { 
      expires: COOKIE_EXPIRATION,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    setIsAuthenticated(true);
  };

  // Clear JWT token from cookie
  const clearAuthCookie = () => {
    Cookies.remove(AUTH_COOKIE_NAME);
    setIsAuthenticated(false);
  };

  // Check if auth cookie exists and is valid
  const checkAuthCookie = () => {
    const token = Cookies.get(AUTH_COOKIE_NAME);
    
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    try {
      // Decode and validate token
      const decodedToken = JSON.parse(atob(token));
      
      // Check if token has user UID that matches current user
      if (decodedToken && currentUser && decodedToken.uid === currentUser.uid) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } catch (err) {
      console.error('Failed to parse auth token:', err);
      clearAuthCookie();
      setIsAuthenticated(false);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // If user exists, set or verify the auth cookie
        const hasValidCookie = checkAuthCookie();
        if (!hasValidCookie) {
          setAuthCookie(user);
        }
      } else {
        // If no user, clear the cookie
        clearAuthCookie();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Also check cookie on mount, in case Firebase auth state is lost but cookie exists
  useEffect(() => {
    checkAuthCookie();
  }, []);

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName
        });
      }
      
      // Create user document in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        displayName,
        email,
        createdAt: new Date(),
        games: {
          tictactoe: { wins: 0, losses: 0, draws: 0 },
          memory: { bestTime: null, gamesPlayed: 0 },
          snake: { highScore: 0, gamesPlayed: 0 },
          tetris: { highScore: 0, gamesPlayed: 0 },
          pong: { wins: 0, losses: 0 }
        }
      });

      // Set auth cookie after successful registration
      setAuthCookie(userCredential.user);
      
      return userCredential;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setError(null);
      
      // Set auth cookie after successful login
      setAuthCookie(userCredential.user);
      
      return userCredential;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      
      // Clear auth cookie on logout
      clearAuthCookie();
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    error,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 