import React from 'react';
import './ProjectTable.css';
import { Box, Hash, GitBranch, Dice5, Layers } from 'lucide-react';

const mockProjects = [
  {
    id: 1,
    name: 'Dropbox Design System',
    hours: 34,
    priority: '',
    members: ['A', 'B', 'C'],
    extraMembers: '+5',
    progress: 15,
    icon: <Box size={24} color="#0061FF" />,
  },
  {
    id: 2,
    name: 'Slack Team UI Design',
    hours: 47,
    priority: '',
    members: ['D', 'E', 'F'],
    extraMembers: '+5',
    progress: 35,
    icon: <Hash size={24} color="#E01E5A" />,
  },
  {
    id: 3,
    name: 'GitHub Satellite',
    hours: 120,
    priority: 'Low',
    members: ['G', 'H'],
    extraMembers: '+1',
    progress: 75,
    icon: <GitBranch size={24} color="#24292e" />,
  },
  {
    id: 4,
    name: '3D Character Modelling',
    hours: 89,
    priority: '',
    members: ['I', 'J', 'K'],
    extraMembers: '+5',
    progress: 63,
    icon: <Dice5 size={24} color="#00C48C" />,
  },
  {
    id: 5,
    name: 'Webapp Design System',
    hours: 108,
    priority: '',
    members: ['L', 'M', 'N'],
    extraMembers: '+5',
    progress: 100,
    icon: <Layers size={24} color="#1EAD5D" />,
  },
];

const ProjectTable: React.FC = () => {
  return (
    <div className="project-table-container">
      <div className="table-header">
        <h2>Active Projects</h2>
      </div>
      <div className="table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>PROJECT NAME</th>
              <th>HOURS</th>
              <th>PRIORITY</th>
              <th>MEMBERS</th>
              <th>PROGRESS</th>
            </tr>
          </thead>
          <tbody>
            {mockProjects.map((project) => (
              <tr key={project.id}>
                <td>
                  <div className="project-name-cell">
                    <div className="project-icon">{project.icon}</div>
                    <span className="project-name">{project.name}</span>
                  </div>
                </td>
                <td className="text-muted">{project.hours}</td>
                <td>
                  {project.priority && (
                    <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                      {project.priority}
                    </span>
                  )}
                </td>
                <td>
                  <div className="members-group">
                    {project.members.map((_, idx) => (
                      <img 
                        key={idx}
                        src={`https://ui-avatars.com/api/?name=User+${idx}&background=random&color=fff`} 
                        alt="member" 
                        className="member-avatar"
                      />
                    ))}
                    <div className="member-avatar extra-members">{project.extraMembers}</div>
                  </div>
                </td>
                <td>
                  <div className="progress-cell">
                    <span className="progress-text">{project.progress}%</span>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;
