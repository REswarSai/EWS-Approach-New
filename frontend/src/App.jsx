import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Prevention from './pages/Prevention';
import CSVUpload from './pages/CSVUpload';
import LiveCapture from './pages/LiveCapture';
import ExampleChartPage from './pages/ExampleChartPage';
import SourceIPStats from './pages/SourceIPStats';
import Navbar from './components/Navbar';
import StartStopComponent from './components/StartStopComponent';
import Detection from './pages/Detection';
import DetectionCSVUpload from './pages/DetectionCSVUpload';
import DetectionLiveTraffic from './pages/DetectionLiveTraffic';

// Layout component that includes the Navbar
const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="w-full">
      {children}
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* Landing page without navbar */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Routes with navbar */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/prevention" element={<Layout><Prevention /></Layout>} />
        <Route path="/csv-upload" element={<Layout><CSVUpload /></Layout>} />
        <Route path="/live-capture" element={<Layout><LiveCapture /></Layout>} />
        <Route path="/flow-analysis" element={<Layout><ExampleChartPage /></Layout>} />
        <Route path="/source-ip-stats" element={<Layout><SourceIPStats /></Layout>} />
        <Route path="/start-stop" element={<Layout><StartStopComponent /></Layout>} />
        
        {/* New Detection Routes */}
        <Route path="/detection" element={<Layout><Detection /></Layout>} />
        <Route path="/detection-upload-csv" element={<Layout><DetectionCSVUpload /></Layout>} />
        <Route path="/detection-live-traffic" element={<Layout><DetectionLiveTraffic /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 