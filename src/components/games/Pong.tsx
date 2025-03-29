import GameUnderDevelopment from '../ui/GameUnderDevelopment';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Pong: React.FC = () => {
  const navigate = useNavigate();
  
  // Redirect from direct URL access after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/games');
    }, 10000); // Redirect after 10 seconds
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return <GameUnderDevelopment gameName="Pong" />;
};

export default Pong; 