import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, Upload, AlertTriangle, FileText, FileSpreadsheet, Plus, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils/helpers';

const Settings: React.FC = () => {
  const { 
    teams, players, history, resetAuction, importBackup, 
    categories, roles, addCategory, removeCategory, addRole, removeRole 
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCategory, setNewCategory] = useState('');
  const [newRole, setNewRole] = useState('');

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the entire auction? All history, sales, and purchases will be lost. This cannot be undone.")) {
      resetAuction();
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      addCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleAddRole = () => {
    if (newRole.trim() && !roles.includes(newRole.trim())) {
      addRole(newRole.trim());
      setNewRole('');
    }
  };

  const exportJSONBackup = () => {
    const data = JSON.stringify({ teams, players, history, categories, roles });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.teams && data.players && data.history) {
          importBackup(data);
          alert('Backup imported successfully!');
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Cricket Auction - Complete Report', 14, 15);
    
    // Team Summary Table
    const teamData = teams.map(t => [
      t.name, 
      formatCurrency(t.initialPurse),
      formatCurrency(t.initialPurse - t.remainingPurse),
      formatCurrency(t.remainingPurse),
      players.filter(p => p.teamId === t.id).length.toString()
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Team', 'Initial Purse', 'Total Spent', 'Remaining Purse', 'Players Bought']],
      body: teamData,
    });

    // Sold Players Table
    const soldPlayers = players.filter(p => p.status === 'sold');
    const playerData = soldPlayers.map(p => [
      p.name,
      p.country,
      p.role,
      p.category,
      teams.find(t => t.id === p.teamId)?.name || 'Unknown',
      formatCurrency(p.soldPrice || 0)
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Player', 'Country', 'Role', 'Category', 'Team', 'Price']],
      body: playerData,
    });

    doc.save(`auction-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Teams Sheet
    const wsTeams = XLSX.utils.json_to_sheet(teams.map(t => ({
      'Team Name': t.name,
      'Initial Purse': t.initialPurse,
      'Total Spent': t.initialPurse - t.remainingPurse,
      'Remaining Purse': t.remainingPurse,
      'Players Bought': players.filter(p => p.teamId === t.id).length
    })));
    XLSX.utils.book_append_sheet(wb, wsTeams, "Teams Summary");

    // Players Sheet
    const wsPlayers = XLSX.utils.json_to_sheet(players.map(p => ({
      'Name': p.name,
      'Country': p.country,
      'Role': p.role,
      'Category': p.category,
      'Base Price': p.basePrice,
      'Status': p.status.toUpperCase(),
      'Team': teams.find(t => t.id === p.teamId)?.name || '',
      'Sold Price': p.soldPrice || ''
    })));
    XLSX.utils.book_append_sheet(wb, wsPlayers, "All Players");

    XLSX.writeFile(wb, `auction-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="page-container animate-fade-in">
      <h1>Settings & Actions</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Dynamic Categories */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Manage Categories</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="New Category..." 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            />
            <button className="btn btn-primary" onClick={handleAddCategory}><Plus size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-glass)', borderRadius: '999px', fontSize: '0.9rem' }}>
                {c}
                <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }} onClick={() => removeCategory(c)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Roles */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Manage Roles</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="New Role..." 
              value={newRole} 
              onChange={e => setNewRole(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAddRole()}
            />
            <button className="btn btn-primary" onClick={handleAddRole}><Plus size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {roles.map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-glass)', borderRadius: '999px', fontSize: '0.9rem' }}>
                {r}
                <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }} onClick={() => removeRole(r)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Export Data */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} /> Export Auction Backup
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Download the complete state of the auction including teams, players, and history. Use this to restore later.
          </p>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={exportJSONBackup}>Export Backup (JSON)</button>
        </div>

        {/* Import Data */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} /> Import Auction Data
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Restore the auction state from a previously exported backup JSON file.
          </p>
          <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImportJSON} />
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => fileInputRef.current?.click()}>
            Import Backup (JSON)
          </button>
        </div>

        {/* Reports */}
        <div className="glass-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} /> Download Reports
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Generate final auction reports in PDF or Excel formats.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={exportToPDF}>
              <FileText size={18} /> Export PDF Report
            </button>
            <button className="btn btn-primary" style={{ backgroundColor: '#10b981', border: 'none', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} onClick={exportToExcel}>
              <FileSpreadsheet size={18} /> Export Excel Report
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} /> Danger Zone
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Reset the entire auction. Teams will keep their initial purse, but all players will become unsold/available and history will be cleared.
          </p>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleReset}>
            Reset Entire Auction
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
