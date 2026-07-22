import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Upload, Edit, Trash2, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { fileToBase64, formatCurrency } from '../utils/helpers';
import type { Player, Role, Category } from '../types';
import * as XLSX from 'xlsx';



const Players: React.FC = () => {
  const { players, addPlayer, updatePlayer, deletePlayer, importPlayers, roles, categories } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState<Role>('Batsman');
  const [category, setCategory] = useState<Category>('Indian');
  const [basePrice, setBasePrice] = useState<number>(2000000); // 20L default
  const [photo, setPhoto] = useState<string>('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setCountry('');
    setRole(roles[0] || '');
    setCategory(categories[0] || '');
    setBasePrice(2000000);
    setPhoto('');
    setNotes('');
    setEditingPlayerId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setName(player.name);
    setCountry(player.country);
    setRole(player.role);
    setCategory(player.category);
    setBasePrice(player.basePrice);
    setPhoto(player.photo || '');
    setNotes(player.notes || '');
    setEditingPlayerId(player.id);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setPhoto(base64);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !country.trim()) return;

    if (editingPlayerId) {
      updatePlayer(editingPlayerId, { name, country, role, category, basePrice, photo, notes });
    } else {
      addPlayer({
        id: crypto.randomUUID(),
        name,
        country,
        role,
        category,
        basePrice,
        photo,
        notes,
        status: 'available'
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const newPlayers: Player[] = data.map(row => ({
        id: crypto.randomUUID(),
        name: row.Name || row.name || 'Unknown',
        country: row.Country || row.country || 'Unknown',
        role: row.Role || row.role || roles[0] || 'Unknown',
        category: row.Category || row.category || categories[0] || 'Unknown',
        basePrice: Number(row.BasePrice || row.basePrice || 2000000),
        notes: row.Notes || row.notes || '',
        status: 'available'
      }));

      importPlayers(newPlayers);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter ? p.role === roleFilter : true;
      const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
      const matchesStatus = statusFilter ? p.status === statusFilter : true;
      return matchesSearch && matchesRole && matchesCategory && matchesStatus;
    });
  }, [players, searchTerm, roleFilter, categoryFilter, statusFilter]);

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Players Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} /> Import Excel/CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Add Player
          </button>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search players by name or country..." 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="input-field" style={{ flex: '1 1 150px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input-field" style={{ flex: '1 1 150px' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-field" style={{ flex: '1 1 150px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
        </select>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Player</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Base Price</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No players found.</td>
              </tr>
            ) : (
              filteredPlayers.map(player => (
                <tr key={player.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                      {player.photo ? <img src={player.photo} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{player.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{player.country}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>{player.role}</td>
                  <td style={{ padding: '1rem' }}>{player.category}</td>
                  <td style={{ padding: '1rem', color: 'var(--gold-accent)' }}>{formatCurrency(player.basePrice)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                      backgroundColor: player.status === 'available' ? 'rgba(59, 130, 246, 0.2)' : player.status === 'sold' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: player.status === 'available' ? '#60a5fa' : player.status === 'sold' ? '#34d399' : '#f87171'
                    }}>
                      {player.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', marginRight: '0.5rem' }} onClick={() => handleOpenEdit(player)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => {
                      if (window.confirm(`Delete ${player.name}?`)) deletePlayer(player.id);
                    }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlayerId ? "Edit Player" : "Add Player"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Country</label>
              <input type="text" className="input-field" value={country} onChange={e => setCountry(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Role</label>
              <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Category</label>
              <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Base Price (₹)</label>
            <input type="number" className="input-field" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} min="0" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Player Photo</label>
            <input type="file" accept="image/*" className="input-field" onChange={handlePhotoUpload} />
            {photo && (
              <div style={{ marginTop: '1rem', width: 80, height: 80, border: '1px solid var(--glass-border)', borderRadius: '50%', overflow: 'hidden' }}>
                <img src={photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingPlayerId ? "Update Player" : "Add Player"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Players;
