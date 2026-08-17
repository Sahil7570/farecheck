import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Result from './pages/Result';
import Report from './pages/Report';

function App() {
  return (
    <div className="min-h-screen sm:min-h-0 sm:h-[844px] w-full sm:max-w-[390px] bg-gray-50 flex flex-col font-sans sm:mx-auto sm:my-8 sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden relative border-0 sm:border-[8px] sm:border-gray-900">
      <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col scroll-smooth">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
