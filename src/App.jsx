import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TimerProvider } from '@/contexts/TimerContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import Dashboard from '@/pages/Dashboard';
import Courses from '@/pages/Courses';
import Planner from '@/pages/Planner';
import TimerPage from '@/pages/Timer';
import Statistics from '@/pages/Statistics';

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <TimerProvider>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/timer" element={<TimerPage />} />
              <Route path="/stats" element={<Statistics />} />
            </Routes>
          </AdminLayout>
        </TimerProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}

export default App;
