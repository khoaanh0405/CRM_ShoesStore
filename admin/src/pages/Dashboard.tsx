import React from 'react';
import StatCard from '../components/StatCard';
import ProjectTable from '../components/ProjectTable';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="page-title">Projects</h1>
          <button className="create-btn">Create New Project</button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="stats-container">
          <StatCard 
            title="Projects" 
            count="18" 
            completedText="2 Completed" 
            iconType="projects" 
          />
          <StatCard 
            title="Active Task" 
            count="132" 
            completedText="28 Completed" 
            iconType="tasks" 
          />
          <StatCard 
            title="Teams" 
            count="12" 
            completedText="1 Completed" 
            iconType="teams" 
          />
          <StatCard 
            title="Productivity" 
            count="76%" 
            completedText="5% Completed" 
            iconType="productivity" 
          />
        </div>
        
        <ProjectTable />
      </div>
    </div>
  );
};

export default Dashboard;
