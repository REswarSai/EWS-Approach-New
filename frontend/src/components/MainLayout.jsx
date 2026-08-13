import Navbar from './Navbar';

const MainLayout = ({ children }) => (
  <div className="min-h-screen bg-background font-sans flex flex-col">
    <Navbar />
    <div className="flex-1 w-full">
      {children}
    </div>
  </div>
);

export default MainLayout; 