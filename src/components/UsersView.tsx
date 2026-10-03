import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import { formatDate, formatDateTime } from '../utils';
import {
  ShieldCheck,
  Users,
  KeyRound,
  FileText,
  CheckCircle2,
  Lock,
  History,
  Shield,
  UserCheck,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, currentUser, setCurrentUser, auditLogs } = useStore();

  const [activeTab, setActiveTabState] = useState<'users' | 'audit'>('users');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const rolePermissions: Record<UserRole, { title: string; color: string; desc: string; permissions: string[] }> = {
    owner: {
      title: 'Store Owner',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Super-admin with unrestricted permissions over billing, finances, catalog, margins, staff, and system settings.',
      permissions: [
        'Full POS Billing & Credit Approval',
        'Catalog CRUD & Price Margins',
        'Supplier Orders & Ledger Payments',
        'Udhaar Credit Limit Overrides',
        'Sales & Profit Financial Analytics',
        'Staff Roles & System Backup/Restore',
      ],
    },
    manager: {
      title: 'Store Manager',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Operational supervision over sales, stock receiving, customer Khata, and commercial daily performance.',
      permissions: [
        'POS Billing & Customer Returns',
        'Inventory Stock Adjustments',
        'Supplier Receiving & Purchases',
        'Customer Khata Management',
        'Operational Daily & Monthly Reports',
      ],
    },
    cashier: {
      title: 'Billing Cashier',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: 'High-speed counter cashiering, barcode scanning, customer deposits, and receipt printing.',
      permissions: [
        'POS Supermarket Billing (F2)',
        'Barcode & QR Scanner',
        'Cash / UPI / Card / Udhaar Payment Collection',
        'Thermal Receipt & Invoice Printing',
        'Customer Payment Deposits',
      ],
    },
    stock_manager: {
      title: 'Stock & Warehouse Manager',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      desc: 'Procurement receiving, shelf inventory replenishment, expiry control, and damage write-offs.',
      permissions: [
        'Stock Receiving from Suppliers',
        'Warehouse Inventory Counts',
        'Damaged / Expired Stock Adjustments',
        'Expiry Date Monitoring & Rotation',
        'Shelf Price Label & Barcode Printing',
      ],
    },
  };

  const filteredLogs = auditLogs.filter((log) => {
    return roleFilter === 'All' || log.userRole === roleFilter;
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6 pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>User Management & Security Audit Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Role-based access control (RBAC), multi-user staff switching, and immutable audit logs
          </p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTabState('users')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'
            }`}
          >
            Staff & Permissions
          </button>
          <button
            onClick={() => setActiveTabState('audit')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Active Staff List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map((u) => {
              const isCurrent = u.id === currentUser.id;
              const roleMeta = rolePermissions[u.role];
              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                    isCurrent
                      ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center font-bold text-neutral-700">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-neutral-900">{u.name}</h3>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 inline-block ${roleMeta.color}`}>
                            {roleMeta.title}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-neutral-500 space-y-0.5 font-mono">
                      <div>{u.email}</div>
                      <div>{u.phone}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    {isCurrent ? (
                      <div className="py-1 px-2 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded text-center flex items-center justify-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Active Session</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCurrentUser(u)}
                        className="w-full py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Switch To This User
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role Permissions Guide */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Role-Based Access Control (RBAC) Permission Matrix</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {(Object.keys(rolePermissions) as UserRole[]).map((r) => {
                const info = rolePermissions[r];
                return (
                  <div key={r} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${info.color}`}>
                      {info.title}
                    </span>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">{info.desc}</p>
                    <div className="pt-2 border-t border-neutral-200 space-y-1">
                      {info.permissions.map((p, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-neutral-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs space-y-3">
          <div className="p-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">System Security Audit Log</h2>
              <p className="text-xs text-neutral-500">
                Immutable records of sales, stock adjustments, pricing edits, and logins
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500 font-medium">Filter by Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="p-1.5 bg-neutral-50 border border-neutral-300 rounded-lg"
              >
                <option value="All">All Roles</option>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="stock_manager">Stock Manager</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider text-[11px] border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Module</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-neutral-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-neutral-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700 capitalize">
                        {log.userRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-neutral-600">{log.entity}</td>
                    <td className="py-3 px-3 font-semibold text-neutral-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
