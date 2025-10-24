import React, { useEffect, useState } from 'react';

const EditQuantityModal = ({ isOpen, item, availableToAdd = 0, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(2);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      const initial = Math.max(2, Number(item.quantity || 0));
      setQuantity(initial);
      setPassword('');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const maxAllowed = (Number(item.quantity) || 0) + (Number(availableToAdd) || 0);

  const handleSave = () => {
    const newQty = Number(quantity);
    if (!Number.isFinite(newQty) || newQty < 2) {
      alert('Please enter a valid quantity (2 or more).');
      return;
    }
    if (newQty > maxAllowed) {
      alert(`Quantity exceeds available stock. Max allowed is ${maxAllowed}.`);
      return;
    }
    onConfirm({ newQuantity: newQty, password });
  };

  return (
    <div className="eqm-overlay" onClick={onClose}>
      <div className="eqm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eqm-header">Edit Quantity</div>
        <div className="eqm-body">
          <div className="eqm-row"><span className="label">Item:</span><span className="value" title={item.name}>{item.name}</span></div>
          <div className="eqm-row"><span className="label">Current:</span><span className="value">{item.quantity}</span></div>
          <div className="eqm-row"><span className="label">Available to add:</span><span className="value">{availableToAdd}</span></div>
          <div className="eqm-field">
            <label htmlFor="eqm-qty">New quantity (min 2):</label>
            <input
              id="eqm-qty"
              type="number"
              min={2}
              max={maxAllowed}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(2, Number(e.target.value) || 2))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
              autoFocus
            />
          </div>
          <div className="eqm-field">
            <label htmlFor="eqm-pass">Password:</label>
            <input
              id="eqm-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to confirm"
            />
          </div>
        </div>
        <div className="eqm-footer">
          <button className="btn cancel" onClick={onClose}>Cancel</button>
          <button className="btn save" onClick={handleSave}>Save</button>
        </div>
      </div>

      <style jsx>{`
        .eqm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }
        .eqm-modal {
          background: #fff;
          width: min(480px, 92vw);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.2);
          overflow: hidden;
          border: 1px solid #DCDCDC;
        }
        .eqm-header {
          padding: 14px 18px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #00796B;
          border-left: 6px solid #FF5722;
          background: #F7F9FA;
        }
        .eqm-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
        .eqm-row { display: flex; justify-content: space-between; gap: 10px; }
        .label { color: #607D8B; font-weight: 600; }
        .value { color: #2c3e50; font-weight: 600; text-align: right; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .eqm-field { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
        .eqm-field input { padding: 10px 12px; border: 2px solid #B0BEC5; border-radius: 10px; font-size: 1rem; }
        .eqm-field input:focus { border-color: #00796B; outline: none; }
        .eqm-footer { padding: 14px 18px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #eee; }
        .btn { padding: 10px 16px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn.cancel { background: #ECEFF1; color: #37474F; }
        .btn.cancel:hover { background: #CFD8DC; }
        .btn.save { background: #00796B; color: #fff; }
        .btn.save:hover { background: #0a8a7b; }
      `}</style>
    </div>
  );
};

export default EditQuantityModal;
