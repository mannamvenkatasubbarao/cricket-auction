import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import Modal from '../components/Modal';
import { fileToBase64, formatCurrency } from '../utils/helpers';
import type { Team } from '../types';

const Teams: React.FC = () => {
  const { teams, addTeam, updateTeam, deleteTeam } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [initialPurse, setInitialPurse] = useState<number>(1000000000); // Default 100 Cr
  const [logo, setLogo] = useState<string>('');

  const resetForm = () => {
    setName('');
    setColor('#3b82f6');
    setInitialPurse(1000000000);
    setLogo('');
    setEditingTeamId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setName(team.name);
    setColor(team.color);
    setInitialPurse(team.initialPurse);
    setLogo(team.logo || '');
    setEditingTeamId(team.id);
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setLogo(base64);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTeamId) {
      // For update, we might also need to recalculate remainingPurse if initialPurse changes, 
      // but for simplicity, we'll just update initialPurse. A more robust system would adjust remainingPurse.
      const team = teams.find(t => t.id === editingTeamId);
      if (team) {
        const diff = initialPurse - team.initialPurse;
        updateTeam(editingTeamId, { 
          name, color, logo, initialPurse, 
          remainingPurse: team.remainingPurse + diff 
        });
      }
    } else {
      addTeam({
        id: crypto.randomUUID(),
        name,
        color,
        logo,
        initialPurse,
        remainingPurse: initialPurse
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Teams Management</h1>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Add Team
        </button>
      </div>
      
      {teams.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No teams created yet. Click "Add Team" to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {teams.map(team => (
            <div key={team.id} className="glass-card" style={{ padding: '1.5rem', borderTop: `4px solid ${team.color}` }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 60, height: 60, borderRadius: '8px', 
                  backgroundColor: team.color + '20', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0
                }}>
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <ImageIcon size={24} color={team.color} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{team.name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Purse: <span style={{ color: 'var(--gold-accent)', fontWeight: 'bold' }}>{formatCurrency(team.remainingPurse)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => handleOpenEdit(team)}>
                      <Edit size={14} /> Edit
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => {
                      if(window.confirm(`Delete ${team.name}?`)) deleteTeam(team.id);
                    }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTeamId ? "Edit Team" : "Add Team"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Team Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Chennai Super Kings" 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Theme Color</label>
              <input 
                type="color" 
                className="input-field" 
                style={{ padding: '0.2rem', height: '45px' }}
                value={color} 
                onChange={e => setColor(e.target.value)} 
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Initial Purse (₹)</label>
              <input 
                type="number" 
                className="input-field" 
                value={initialPurse} 
                onChange={e => setInitialPurse(Number(e.target.value))} 
                min="0"
                required 
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Team Logo</label>
            <input 
              type="file" 
              accept="image/*" 
              className="input-field" 
              onChange={handleLogoUpload} 
            />
            {logo && (
              <div style={{ marginTop: '1rem', width: 80, height: 80, border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingTeamId ? "Update Team" : "Create Team"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teams;
