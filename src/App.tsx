import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { CreateGoalPage } from '@/pages/CreateGoalPage';
import { PlanPage } from '@/pages/PlanPage';
import { TimerPage } from '@/pages/TimerPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useAppStore } from '@/store/appStore';

function AppContent() {
  const { loadData } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateGoalPage />} />
        <Route path="/plan/:goalId" element={<PlanPage />} />
        <Route path="/timer/:goalId" element={<TimerPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return <AppContent />;
}
