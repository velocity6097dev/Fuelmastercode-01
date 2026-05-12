import React, { useState, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import { triggerHaptic } from '../../utils/audio'; 
import { ImpactStyle } from '@capacitor/haptics';
import { 
  Receipt, 
  UploadCloud, 
  X,
  Printer
} from 'lucide-react';

const ReimbursementInvoice = () => {
  // Invoice Data State
  const [invoiceNo, setInvoiceNo] = useState(`INV-${new Date().getFullYear()}-001`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Station Maintenance');
  const [remarks, setRemarks] = useState('');

  // 6cm Pump Header State
  const [pumpHeaderImg, setPumpHeaderImg] = useState(null);
  const fileInputRef = useRef(null);

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
      const imageUrl = URL.createObjectURL(file);
      setPumpHeaderImg(imageUrl);
    }
  };

  const clearHeader = () => {
    try { triggerHaptic(ImpactStyle.Medium); } catch(e) {}
    setPumpHeaderImg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    try { triggerHaptic(ImpactStyle.Heavy); } catch(e) {}
    window.print();
  };

  return (
    <div className="app-layout">
      {/* Injecting print-specific CSS so the Navbar, Buttons, and Form 
        disappear when saving as PDF, leaving only the clean invoice!
      */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
            .no-print { display: none !important; }
            body { background: white; }
          }
        `}
      </style>

      <div className="no-print">
        <Navbar title="Reimbursement" />
      </div>
      
      <main className="main-content" style={{ paddingTop: '10px' }}>
        
        {/* --- FORM SECTION (Hidden during print) --- */}
        <div className="content-card animate__animated animate__fadeIn no-print" style={{ marginBottom: '30px' }}>
          <div className="card-head">
            <h3><Receipt size={20} color="var(--primary)" /> Invoice Details</h3>
          </div>

          <div className="input-group">
            <label>Invoice / Reference Number</label>
            <input 
              type="text" 
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
          </div>

          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '16px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Amount (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Expense Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Station Maintenance">Station Maintenance</option>
              <option value="Travel Allowance">Travel Allowance</option>
              <option value="Weights & Measures Calibration">Weights & Measures Calibration</option>
              <option value="Safety Equipment">Safety Equipment</option>
              <option value="Other">Other Expenses</option>
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Remarks / Description</label>
            <textarea 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Brief description of the expense..."
              style={{
                width: '100%', padding: '14px', border: '1px solid var(--border)',
                borderRadius: '12px', fontSize: '1rem', color: 'var(--text-main)',
                background: 'var(--bg-body)', outline: 'none', resize: 'vertical', minHeight: '80px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>


        {/* --- THE PRINTABLE INVOICE AREA --- */}
        <div 
          className="print-area animate__animated animate__fadeInUp" 
          style={{ 
            background: 'white', 
            borderRadius: '0px', // Square corners for print
            boxShadow: 'var(--shadow-card)',
            minHeight: '800px',
            border: '1px solid var(--border)',
            position: 'relative'
          }}
        >
          {/* THE 6CM PUMP HEADER SPACE (~227px for print scaling) */}
          <div 
            style={{ 
              height: '227px', 
              width: '100%', 
              backgroundColor: pumpHeaderImg ? 'white' : 'var(--bg-body)',
              borderBottom: pumpHeaderImg ? 'none' : '2px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {pumpHeaderImg ? (
              <>
                <img 
                  src={pumpHeaderImg} 
                  alt="Pump Header" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
                <button 
                  className="no-print"
                  onClick={clearHeader}
                  style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'rgba(0,0,0,0.5)', color: 'white',
                    border: 'none', borderRadius: '50%', padding: '8px',
                    cursor: 'pointer', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <div 
                className="no-print"
                onClick={() => fileInputRef.current.click()}
                style={{ cursor: 'pointer', textAlign: 'center', color: 'var(--text-muted)' }}
              >
                <UploadCloud size={40} style={{ marginBottom: '10px', opacity: 0.5, margin: '0 auto' }} />
                <p style={{ fontWeight: 600, margin: 0 }}>Upload Station Letterhead</p>
                <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>Click to insert header into the 6cm space</p>
              </div>
            )}
            
            {/* Hidden File Input */}
            <input 
              type="file" accept="image/*" 
              ref={fileInputRef} onChange={handleImageUpload} 
              style={{ display: 'none' }} 
            />
          </div>

          {/* INVOICE BODY (Formatted for paper) */}
          <div style={{ padding: '40px' }}>
            <h2 style={{ textAlign: 'center', textDecoration: 'underline', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Reimbursement Invoice
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontWeight: 600 }}>
              <div>Invoice No: {invoiceNo || 'N/A'}</div>
              <div>Date: {date || 'N/A'}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '50px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'left', backgroundColor: '#f8fafc' }}>Description</th>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'left', backgroundColor: '#f8fafc' }}>Category</th>
                  <th style={{ border: '1px solid black', padding: '12px', textAlign: 'right', backgroundColor: '#f8fafc' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '15px' }}>{remarks || 'Reimbursement Claim'}</td>
                  <td style={{ border: '1px solid black', padding: '15px' }}>{category}</td>
                  <td style={{ border: '1px solid black', padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>
                    {amount ? `₹ ${parseFloat(amount).toFixed(2)}` : '₹ 0.00'}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid black', width: '200px', paddingTop: '10px' }}>Prepared By / Signature</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid black', width: '200px', paddingTop: '10px' }}>Manager / Authorized Signatory</div>
              </div>
            </div>
          </div>

        </div>

        {/* PRINT BUTTON */}
        <button 
          className="primary-btn no-print" 
          onClick={handlePrint}
          style={{ width: '100%', marginTop: '20px', padding: '18px', fontSize: '1.1rem' }}
        >
          <Printer size={22} style={{ marginRight: '10px' }} />
          Print / Save as PDF
        </button>

      </main>
    </div>
  );
};

export default ReimbursementInvoice;