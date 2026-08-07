import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const StudentProfile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (studentId) {
      navigate(`/profile/${studentId}`, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [studentId, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-24 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Redirecting to profile...</div>
      </div>
    </div>
  );
};

export default StudentProfile;
