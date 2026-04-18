import React from 'react';
import { UserRole, getRoleDisplayName } from './rbac';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  onRoleChange,
}) => {
  const roles: UserRole[] = ['admin', 'accountant', 'store_manager'];

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      backgroundColor: '#f0f0f0',
      padding: '10px 15px',
      borderRadius: '6px',
      zIndex: 1000,
      fontSize: '12px',
      border: '1px solid #ddd',
    }}>
      <label style={{ marginRight: '10px', fontWeight: 'bold' }}>
        Vai trò:
      </label>
      <select
        value={currentRole}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        style={{
          padding: '5px 8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          cursor: 'pointer',
        }}
      >
        {roles.map(role => (
          <option key={role} value={role}>
            {getRoleDisplayName(role)}
          </option>
        ))}
      </select>
    </div>
  );
};
