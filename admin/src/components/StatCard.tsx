import React from 'react';
import './StatCard.css';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <h3 className="stat-title">{label}</h3>

        <div className="icon-wrapper">
          <Icon size={20} className="stat-icon" />
        </div>
      </div>

      <div className="stat-body">
        <div className="stat-count">{value}</div>
      </div>
    </div>
  );
};

export default StatCard;