import React from 'react';

interface RoleBadgeProps {
  role?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'card';
}

// Helper function to get role styling
const getRoleStyling = (role?: string) => {
  if (!role) {
    return {
      icon: '👤',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      hoverBgColor: 'hover:bg-gray-200',
      label: 'Unknown'
    };
  }

  switch (role.toUpperCase()) {
    case 'PM':
      return {
        icon: '👨‍💼',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        hoverBgColor: 'hover:bg-purple-200',
        label: 'Project Manager'
      };
    case 'OWNER':
      return {
        icon: '👨‍💻',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        hoverBgColor: 'hover:bg-blue-200',
        label: 'Owner'
      };
    case 'DEV':
      return {
        icon: '👨‍🔧',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        hoverBgColor: 'hover:bg-green-200',
        label: 'Developer'
      };
    default:
      return {
        icon: '👤',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        hoverBgColor: 'hover:bg-gray-200',
        label: role
      };
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        icon: 'text-sm',
        label: 'text-xs px-2 py-1',
        container: 'px-2 py-1'
      };
    case 'md':
      return {
        icon: 'text-lg',
        label: 'text-xs px-2 py-1',
        container: 'px-3 py-2'
      };
    case 'lg':
      return {
        icon: 'text-xl',
        label: 'text-sm px-3 py-1',
        container: 'px-4 py-3'
      };
  }
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  showIcon = true,
  showLabel = true,
  size = 'md',
  variant = 'badge'
}) => {
  const roleStyle = getRoleStyling(role);
  const sizeClasses = getSizeClasses(size);

  if (variant === 'card') {
    return (
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${roleStyle.bgColor} ${roleStyle.textColor} ${roleStyle.borderColor} ${roleStyle.hoverBgColor} transition-colors`}>
        {showIcon && <span className={sizeClasses.icon}>{roleStyle.icon}</span>}
        <div className="flex flex-col">
          {showLabel && (
            <span className={`${sizeClasses.label} rounded-full ${roleStyle.bgColor} ${roleStyle.textColor} bg-opacity-50`}>
              {roleStyle.label}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${sizeClasses.container} rounded-full ${roleStyle.bgColor} ${roleStyle.textColor} border ${roleStyle.borderColor}`}>
      {showIcon && <span className={sizeClasses.icon}>{roleStyle.icon}</span>}
      {showLabel && <span className="font-medium">{roleStyle.label}</span>}
    </div>
  );
};

export const RoleIcon: React.FC<{ role?: string; size?: 'sm' | 'md' | 'lg' }> = ({ role, size = 'md' }) => {
  const roleStyle = getRoleStyling(role);
  const sizeClasses = getSizeClasses(size);
  
  return <span className={sizeClasses.icon}>{roleStyle.icon}</span>;
};

export const RoleLabel: React.FC<{ role?: string; size?: 'sm' | 'md' | 'lg' }> = ({ role, size = 'md' }) => {
  const roleStyle = getRoleStyling(role);
  const sizeClasses = getSizeClasses(size);
  
  return (
    <span className={`${sizeClasses.label} rounded-full ${roleStyle.bgColor} ${roleStyle.textColor} inline-block`}>
      {roleStyle.label}
    </span>
  );
};

export { getRoleStyling }; 