const Footer = () => {
  return (
    <footer className="bg-dark-light py-6 md:py-8 mt-auto border-t border-dark-lighter">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400 text-sm md:text-base">© {new Date().getFullYear()} GamesHub. All rights reserved.</p>
        <div className="flex flex-col md:flex-row justify-center md:space-x-6 space-y-4 md:space-y-0 mt-4">
          <a href="#" className="text-gray-400 hover:text-primary text-sm md:text-base transition-colors">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-primary text-sm md:text-base transition-colors">Terms of Service</a>
          <a href="#" className="text-gray-400 hover:text-primary text-sm md:text-base transition-colors">Contact Us</a>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
          </a>
          <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 