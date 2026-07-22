import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Check, X, ArrowLeft, ArrowRight, RotateCcw, AlertTriangle, Play, Pause } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const BIDS = [100000, 200000, 500000, 1000000, 2500000, 5000000, 10000000]; // 1L, 2L, 5L, 10L, 25L, 50L, 1Cr

const Auction: React.FC = () => {
  const { 
    teams, players, currentPlayerId, currentBid, biddingTeamId, isPaused,
    setAuctionPlayer, placeBid, undoBid, sellPlayer, markUnsold, undoLastSale,
    pauseAuction, resumeAuction
  } = useStore();

  const [manualBid, setManualBid] = useState('');

  // Derived state
  const availablePlayers = useMemo(() => players.filter(p => p.status === 'available'), [players]);
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const biddingTeam = teams.find(t => t.id === biddingTeamId);

  // Initialize first player if none selected
  useEffect(() => {
    if (!currentPlayerId && availablePlayers.length > 0) {
      setAuctionPlayer(availablePlayers[0].id);
    }
  }, [currentPlayerId, availablePlayers, setAuctionPlayer]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.key) {
        case 's': sellPlayer(); break;
        case 'u': markUnsold(); break;
        case 'ArrowRight': handleNextPlayer(); break;
        case 'ArrowLeft': handlePrevPlayer(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPlayerId, currentBid, biddingTeamId, isPaused]);

  const handleNextPlayer = () => {
    if (!currentPlayerId) return;
    const currentIndex = availablePlayers.findIndex(p => p.id === currentPlayerId);
    if (currentIndex >= 0 && currentIndex < availablePlayers.length - 1) {
      setAuctionPlayer(availablePlayers[currentIndex + 1].id);
    }
  };

  const handlePrevPlayer = () => {
    if (!currentPlayerId) return;
    const currentIndex = availablePlayers.findIndex(p => p.id === currentPlayerId);
    if (currentIndex > 0) {
      setAuctionPlayer(availablePlayers[currentIndex - 1].id);
    }
  };

  const handleBid = (teamId: string, amount: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const newBid = currentBid === 0 ? currentPlayer?.basePrice || 0 : currentBid + amount;
    
    if (newBid <= team.remainingPurse) {
      placeBid(teamId, newBid);
    } else {
      alert("Insufficient Purse!");
    }
  };

  const handleManualBidSubmit = (teamId: string) => {
    const amount = Number(manualBid);
    if (isNaN(amount) || amount <= 0) return;
    
    const team = teams.find(t => t.id === teamId);
    if (team && amount <= team.remainingPurse && amount > currentBid) {
      placeBid(teamId, amount);
      setManualBid('');
    }
  };

  if (players.length === 0 || teams.length === 0) {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--gold-accent)" style={{ marginBottom: '1rem' }} />
          <h2>Setup Required</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Please add at least one team and one player to start the auction.</p>
        </div>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>No Available Players</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>All players have been auctioned!</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={undoLastSale}>Undo Last Sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ padding: '1rem' }}>
      
      {/* Top Bar for Auction Controls */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={handlePrevPlayer} disabled={availablePlayers.findIndex(p => p.id === currentPlayerId) === 0}>
            <ArrowLeft size={18} /> Prev
          </button>
          <button className="btn btn-outline" onClick={handleNextPlayer} disabled={availablePlayers.findIndex(p => p.id === currentPlayerId) === availablePlayers.length - 1}>
            Next <ArrowRight size={18} />
          </button>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '1rem' }}>
            Player {availablePlayers.findIndex(p => p.id === currentPlayerId) + 1} of {availablePlayers.length}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={isPaused ? resumeAuction : pauseAuction}>
            {isPaused ? <><Play size={18} /> Resume</> : <><Pause size={18} /> Pause</>}
          </button>
          <button className="btn btn-outline" onClick={undoLastSale}>
            <RotateCcw size={18} /> Undo Last Sale
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 160px)' }}>
        
        {/* Left Side: Player Display */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {isPaused && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <h1 style={{ fontSize: '3rem', color: 'var(--gold-accent)' }}>PAUSED</h1>
            </div>
          )}
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
            <div style={{ 
              width: 250, height: 250, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', 
              marginBottom: '2rem', overflow: 'hidden', border: '4px solid var(--glass-border)',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
            }}>
              {currentPlayer.photo ? (
                <img src={currentPlayer.photo} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: 'var(--text-muted)' }}>
                  {currentPlayer.name.charAt(0)}
                </div>
              )}
            </div>
            
            <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {currentPlayer.name}
            </h1>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--bg-glass)', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 600 }}>{currentPlayer.country}</span>
              <span style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--bg-glass)', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 600 }}>{currentPlayer.role}</span>
              <span style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--bg-glass)', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--blue-accent)' }}>{currentPlayer.category}</span>
            </div>

            <div style={{ marginTop: 'auto', width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>BASE PRICE</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--gold-accent)' }}>{formatCurrency(currentPlayer.basePrice)}</div>
            </div>
          </div>
          
          {/* Current Bid Display */}
          <div style={{ backgroundColor: biddingTeam ? biddingTeam.color + '40' : 'rgba(255,255,255,0.05)', padding: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s ease' }}>
            <div>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CURRENT BID</div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {currentBid > 0 ? formatCurrency(currentBid) : '---'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>BIDDING TEAM</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: biddingTeam?.color || 'var(--text-muted)' }}>
                {biddingTeam?.name || '---'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Teams and Controls */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Main Action Buttons */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ height: '60px', fontSize: '1.2rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }} onClick={sellPlayer} disabled={!biddingTeamId || isPaused}>
              <Check size={24} /> SELL (S)
            </button>
            <button className="btn btn-danger" style={{ height: '60px', fontSize: '1.2rem' }} onClick={markUnsold} disabled={isPaused}>
              <X size={24} /> UNSOLD (U)
            </button>
            <button className="btn btn-outline" style={{ gridColumn: 'span 2' }} onClick={undoBid} disabled={currentBid === 0 || isPaused}>
              <RotateCcw size={18} /> Undo Current Bid
            </button>
          </div>

          {/* Teams List for Bidding */}
          <div className="glass-card" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>TEAMS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {teams.map(team => (
                <div key={team.id} style={{ 
                  padding: '1rem', borderRadius: '8px', 
                  backgroundColor: biddingTeamId === team.id ? team.color + '30' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${biddingTeamId === team.id ? team.color : 'transparent'}`,
                  transition: 'all 0.2s',
                  opacity: team.remainingPurse < (currentBid || currentPlayer.basePrice) ? 0.5 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{team.name}</div>
                    <div style={{ color: 'var(--gold-accent)', fontWeight: 600 }}>{formatCurrency(team.remainingPurse)}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} onClick={() => handleBid(team.id, 0)} disabled={isPaused || team.remainingPurse < currentPlayer.basePrice}>
                      Base
                    </button>
                    {BIDS.map(amount => (
                      <button key={amount} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} onClick={() => handleBid(team.id, amount)} disabled={isPaused || team.remainingPurse < (currentBid + amount)}>
                        +{amount >= 10000000 ? `${amount/10000000}Cr` : `${amount/100000}L`}
                      </button>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ padding: '0.5rem' }} 
                      placeholder="Custom Bid"
                      value={manualBid}
                      onChange={e => setManualBid(e.target.value)}
                      disabled={isPaused}
                    />
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => handleManualBidSubmit(team.id)} disabled={isPaused}>Bid</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auction;
