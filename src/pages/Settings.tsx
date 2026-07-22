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
    doc.setFontSize(18);
    doc.text("Cricket Auction Report", 14, 15);

    let firstSection = true;

    teams.forEach((team) => {
      const teamPlayers = players.filter(p => p.teamId === team.id);

      if (!firstSection) doc.addPage();
      firstSection = false;

      doc.setFontSize(16);
      doc.text(team.name, 14, 20);

      autoTable(doc, {
        startY: 28,
        head: [["Player", "Country", "Role", "Category", "Base Price", "Sold Price"]],
        body: teamPlayers.map(player => [
          player.name,
          player.country,
          player.role,
          player.category,
          formatCurrency(player.basePrice),
          formatCurrency(player.soldPrice || 0)
        ]),
      });

      const endY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`Players Bought: ${teamPlayers.length}`, 14, endY);
      doc.text(`Total Spent: ${formatCurrency(team.initialPurse - team.remainingPurse)}`, 14, endY + 8);
      doc.text(`Remaining Purse: ${formatCurrency(team.remainingPurse)}`, 14, endY + 16);
    });

    doc.save("Auction_Report.pdf");
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    teams.forEach(team => {
      const teamPlayers = players.filter(p => p.teamId === team.id);

      const rows = [
        { Player: "TEAM", Country: team.name, Role: "", Category: "", "Base Price": "", "Sold Price": "", Status: "" },
        { Player: "Initial Purse", Country: team.initialPurse, Role: "", Category: "", "Base Price": "", "Sold Price": "", Status: "" },
        { Player: "Remaining Purse", Country: team.remainingPurse, Role: "", Category: "", "Base Price": "", "Sold Price": "", Status: "" },
        { Player: "Total Spent", Country: team.initialPurse - team.remainingPurse, Role: "", Category: "", "Base Price": "", "Sold Price": "", Status: "" },
        {},
        ...teamPlayers.map(player => ({
          Player: player.name,
          Country: player.country,
          Role: player.role,
          Category: player.category,
          "Base Price": player.basePrice,
          "Sold Price": player.soldPrice || "",
          Status: player.status
        }))
      ];

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, team.name.substring(0, 31));
    });

    XLSX.writeFile(wb, "Auction_Report.xlsx");
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
