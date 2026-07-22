import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { formatCurrency } from '../utils/helpers';
import { History, Users, Shield, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { teams, players, history } = useStore();
  
  const soldPlayers = useMemo(() => players.filter(p => p.status === 'sold'), [players]);
  const unsoldPlayers = useMemo(() => players.filter(p => p.status === 'unsold'), [players]);
  
  const totalSpent = useMemo(() => soldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0), [soldPlayers]);
  
  const highestBid = useMemo(() => {
    if (soldPlayers.length === 0) return null;
    return soldPlayers.reduce((max, p) => (p.soldPrice || 0) > (max.soldPrice || 0) ? p : max, soldPlayers[0]);
  }, [soldPlayers]);

  const teamSpendingData = useMemo(() => {
    return teams.map(t => ({
      name: t.name,
      spent: t.initialPurse - t.remainingPurse,
      remaining: t.remainingPurse,
      color: t.color
    })).sort((a, b) => b.spent - a.spent);
  }, [teams]);

  const roleData = useMemo(() => {
    const data = soldPlayers.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [soldPlayers]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="page-container animate-fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Auction Dashboard</h1>
      
      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <Users size={32} color="var(--blue-accent)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Players</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{players.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--green-accent)' }}>{soldPlayers.length} Sold / {unsoldPlayers.length} Unsold</div>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px' }}>
            <Shield size={32} color="var(--gold-accent)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Teams</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{teams.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
            <DollarSign size={32} color="var(--green-accent)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Spent</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-accent)' }}>{formatCurrency(totalSpent)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
            <History size={32} color="#ef4444" />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Most Expensive</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{highestBid ? highestBid.name : 'N/A'}</div>
            <div style={{ fontSize: '0.9rem' }}>{highestBid ? formatCurrency(highestBid.soldPrice || 0) : ''}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Team Spending Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Team Spending</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={teamSpendingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-navy)', borderColor: 'var(--glass-border)', color: 'white' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                  {teamSpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Roles Sold</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {roleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-navy)', borderColor: 'var(--glass-border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent History Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Recent Auction History</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem' }}>Player</th>
              <th style={{ padding: '1rem' }}>Action</th>
              <th style={{ padding: '1rem' }}>Team</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().slice(0, 10).map(h => {
              const player = players.find(p => p.id === h.playerId);
              const team = teams.find(t => t.id === h.teamId);
              return (
                <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{player?.name || 'Unknown'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: h.action === 'sold' ? '#34d399' : '#f87171' }}>
                      {h.action.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{team?.name || '---'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--gold-accent)' }}>
                    {h.soldPrice ? formatCurrency(h.soldPrice) : '---'}
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No history yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default Dashboard;
