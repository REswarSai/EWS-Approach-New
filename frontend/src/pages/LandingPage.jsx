import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import cyberBackground from '../images/network-bckg.jpg';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.6)), url(${cyberBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Subtle grid overlay for tech feel */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-grid-white/[0.05]"></div>
      
      <div className="relative z-10 w-full max-w-4xl px-6 py-16">
        <div className="text-center space-y-12">
          {/* Logo/Header */}
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-blue-500 blur-xl opacity-20"></div>
              <div className="relative flex items-center justify-center h-32 w-32 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-full">
                <ShieldExclamationIcon className="h-16 w-16 text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Early Warning Systems
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                DDoS Protection
              </span>
            </h1>
            <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Engineered to prevent DDoS attacks before they reach your network — with predictive monitoring, early warning alerts, and real-time response mechanisms that ensure uninterrupted protection.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mt-16">
            <button
              onClick={() => navigate('/prevention')}
              className="relative px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-lg font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <ShieldExclamationIcon className="h-6 w-6" />
                <span>Prevention</span>
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;