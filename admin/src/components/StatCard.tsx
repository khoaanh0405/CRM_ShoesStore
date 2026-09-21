import React from 'react';
import { Briefcase, ListTodo, Users, Target } from 'lucide-react';
import './StatCard.css';

type IconType = 'projects' | 'tasks' | 'teams' | 'productivity';

interface StatCardProps {
  title: string;
  count: string;
  completedText: string;
  iconType: IconType;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, completedText, iconType }) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'projects':
        return <Briefcase size={20} className="stat-icon" />;
      case 'tasks':
        return <ListTodo size={20} className="stat-icon" />;
      case 'teams':
        return <Users size={20} className="stat-icon" />;
      case 'productivity':
        return <Target size={20} className="stat-icon" />;
      default:
        return <Briefcase size={20} className="stat-icon" />;
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        <div className="icon-wrapper">
          {renderIcon()}
        </div>
      </div>
      <div className="stat-body">
        <div className="stat-count">{count}</div>
        <div className="stat-completed">{completedText}</div>
      </div>
    </div>
  );
};

export default StatCard;
