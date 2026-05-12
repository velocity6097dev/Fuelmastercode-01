import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { triggerHaptic } from '../../utils/audio'; 
import { ImpactStyle } from '@capacitor/haptics';
import { jsPDF } from 'jspdf';
import { 
  UploadCloud, 
  X,
  Loader2,
  Building,
  CalendarDays,
  Settings2,
  FileCheck2,
  Banknote
} from 'lucide-react';

const ReimbursementInvoice = () => {
  // --- STATE: 6CM HEADER ---
  const [pumpHeaderImg, setPumpHeaderImg] = useState(null);
  const headerInputRef = useRef(null);

  // --- STATE: DEALER INFO (Saved to Local Storage) ---
  const [dealerCode, setDealerCode] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [gstin, setGstin] = useState('');
  const [panNo, setPanNo] = useState('');
  const [dealerName, setDealerName] = useState('');

  // --- STATE: DATES & ENCLOSURES ---
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [stampingDate, setStampingDate] = useState(new Date().toISOString().split('T')[0]);
  const [grnNo, setGrnNo] = useState('');
  const [grnDate, setGrnDate] = useState('');
  const [certNo, setCertNo] = useState('');
  const [certDate, setCertDate] = useState('');

  // --- STATE: EQUIPMENT & PRICING ---
  const [mpdModel, setMpdModel] = useState('MIDCO');
  const [mpdNozzles, setMpdNozzles] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('0');

  // --- STATE: ATTACHMENTS ---
  const [certImg, setCertImg] = useState(null);
  const certInputRef = useRef(null);
  const [receiptImg, setReceiptImg] = useState(null);
  const receiptInputRef = useRef(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  // ==========================================
  // LOCAL STORAGE (PERSISTENCE)
  // ==========================================
  // Load saved data when the component mounts
  useEffect(() => {
    const savedVendor = localStorage.getItem('wm_vendorCode');
    const savedGstin = localStorage.getItem('wm_gstin');
    const savedPan = localStorage.getItem('wm_panNo');
    const savedDealerName = localStorage.getItem('wm_dealerName');
    
    if (savedVendor) setVendorCode(savedVendor);
    if (savedGstin) setGstin(savedGstin);
    if (savedPan) setPanNo(savedPan);
    if (savedDealerName) setDealerName(savedDealerName);
  }, []);

  // Save data automatically whenever these specific fields change
  useEffect(() => {
    localStorage.setItem('wm_vendorCode', vendorCode);
    localStorage.setItem('wm_gstin', gstin);
    localStorage.setItem('wm_panNo', panNo);
    localStorage.setItem('wm_dealerName', dealerName);
  }, [vendorCode, gstin, panNo, dealerName]);


  // ==========================================
  // AUTO-FILL LOGIC
  // ==========================================
  const handleDealerCodeChange = (e) => {
    const val = e.target.value.toUpperCase();
    setDealerCode(val);
    if (!invoiceNo || invoiceNo.endsWith('/WM0001')) {
      setInvoiceNo(val ? `${val}/WM0001` : '');
    }
  };

  const handleGstinChange = (e) => {
    const val = e.target.value.toUpperCase();
    setGstin(val);
    if (val.length >= 12) {
      setPanNo(val.substring(2, 12));
    } else {
      setPanNo('');
    }
  };

  // ==========================================
  // MATH & CALCULATION LOGIC 
  // ==========================================
  const nozzles = parseInt(mpdNozzles) || 0;
  const stampingFee = nozzles * 1500;
  const numAddAmt = parseFloat(additionalCharges) || 0;
  
  const grandTotal = stampingFee + numAddAmt;

  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '','Twenty ','Thirty ','Forty ','Fifty ','Sixty ','Seventy ','Eighty ','Ninety '];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]]) : '';
    return str.trim() + ' Only';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dateStr.split('-').reverse().join('-');
  };

  const getFinancialYear = (dateStr) => {
    if (!dateStr) return "2025-26"; 
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth(); 
    
    if (month < 3) {
      return `${year - 1}-${year.toString().slice(-2)}`;
    } else {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    }
  };

  // ==========================================
  // IMAGE COMPRESSION
  // ==========================================
  const handleImageUpload = (e, setterFn) => {
    const file = e.target.files[0];
    if (!file) return;
    try { triggerHaptic(ImpactStyle.Light); } catch(e) {}

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;

        if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        setterFn(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // PDF GENERATOR 
  // ==========================================
  const generatePDF = async (action = 'download') => {
    if (!dealerCode || !invoiceNo || !gstin) {
      alert("Please fill in Dealer Code, Invoice No, and GSTIN!");
      return;
    }

    try { triggerHaptic(ImpactStyle.Heavy); } catch(e) {}
    setIsGenerating(true);
    setLoadingType(action);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;
      const startX = 15;
      const pageW = 180;
      let y = 60; // 6cm Header Space

      // --- Draw 6cm Header ---
      if (pumpHeaderImg) {
        doc.addImage(pumpHeaderImg, 'JPEG', 0, 0, 210, 60);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, 210, 60, 'F');
        doc.setFontSize(12);
        doc.setTextColor(148, 163, 184);
        doc.text("NO STATION HEADER PROVIDED", 105, 30, { align: "center" });
      }

      const printText = (text, x, curY, size = 10, font = "helvetica", style = "normal", align = "left") => {
        doc.setFontSize(size); doc.setFont(font, style); doc.setTextColor(0, 0, 0);
        doc.text(text, x, curY, { align: align });
      };

      // Outer Corporate Border
      doc.setLineWidth(0.4);
      doc.rect(12, y + 8, pageW + 6, 200);

      // Title
      printText("INVOICE", 105, y + 15, 14, "helvetica", "bold", "center");
      y += 22;

      // Top Row (Invoice / Vendor Code)
      doc.setLineWidth(0.2);
      doc.rect(startX, y, pageW, 16); 
      doc.line(startX, y + 8, startX + pageW, y + 8); 
      doc.line(startX + 90, y, startX + 90, y + 16); 

      printText("INVOICE NO:", startX + 2, y + 5, 9, "helvetica", "bold");
      printText(invoiceNo, startX + 25, y + 5, 9);
      printText("VENDOR CODE :", startX + 92, y + 5, 9, "helvetica", "bold");
      printText(vendorCode || "N/A", startX + 120, y + 5, 9);

      printText("INVOICE DATE:", startX + 2, y + 13, 9, "helvetica", "bold");
      printText(formatDate(invoiceDate), startX + 28, y + 13, 9);
      printText("GSTN NO :", startX + 92, y + 13, 9, "helvetica", "bold");
      printText("19AAWFB8708J1ZO", startX + 112, y + 13, 9);

      y += 16;
      doc.rect(startX, y, pageW, 8); 
      doc.line(startX + 90, y, startX + 90, y + 8); 
      printText("PAN NO :", startX + 92, y + 5, 9, "helvetica", "bold");
      printText("AAWFB8708J", startX + 110, y + 5, 9);

      y += 12;
      printText("Subject: Reimbursement of Stamping Fee", 105, y + 5, 10, "helvetica", "bold", "center");
      doc.line(75, y + 6, 135, y + 6); // Underline subject
      
      y += 12;
      doc.rect(startX, y, pageW, 25);
      doc.line(startX + 90, y, startX + 90, y + 25); 

      // Left Address
      printText("Consignee/Buyer Address:", startX + 2, y + 5, 9, "helvetica", "bold");
      printText("Bharat Petroleum Corporation Limited", startX + 2, y + 10, 8, "helvetica", "bold");
      printText("Bharat Bhavan, Plot No.31\nPrince Gulam Md.Shah Road,\nGolf Green, Kolkata-700095", startX + 2, y + 14, 8);

      // Right Address
      printText("Billing Address:", startX + 92, y + 5, 9, "helvetica", "bold");
      printText("M/s Bharat Petroleum Corporation Limited", startX + 92, y + 10, 8, "helvetica", "bold");
      printText("Business Excellence center (BPEC)\nPlot No.6, Sector-2\nBehind CIDCO Garden. Kahargar,\nNAVI MUMBAI-410210", startX + 92, y + 14, 8);

      y += 25;
      doc.rect(startX, y, pageW, 8);
      printText("BPCL PAN NO:AAACB2902M GSTN : 19AAACB2902M1ZQ", startX + 2, y + 5, 9, "helvetica", "bold");

      y += 8;
      // Main Items Table Header
      doc.rect(startX, y, pageW, 8);
      printText("SR NO.", startX + 5, y + 5, 8, "helvetica", "bold");
      printText("HSN/SAC", startX + 20, y + 5, 8, "helvetica", "bold");
      printText("Description", startX + 45, y + 5, 8, "helvetica", "bold");
      printText("QNTY", startX + 130, y + 5, 8, "helvetica", "bold");
      printText("RATE", startX + 145, y + 5, 8, "helvetica", "bold");
      printText("Amount", startX + 165, y + 5, 8, "helvetica", "bold");

      // Table Data Boundaries (Dynamic based on T.A.)
      y += 8;
      let tableHeight = (numAddAmt > 0) ? 20 : 12;
      doc.rect(startX, y, pageW, tableHeight);

      // Draw vertical lines matching dynamic height
      doc.line(startX + 15, y - 8, startX + 15, y + tableHeight); 
      doc.line(startX + 40, y - 8, startX + 40, y + tableHeight); 
      doc.line(startX + 125, y - 8, startX + 125, y + tableHeight); 
      doc.line(startX + 140, y - 8, startX + 140, y + tableHeight); 
      doc.line(startX + 160, y - 8, startX + 160, y + tableHeight); 

      // Row 1
      const financialYearText = getFinancialYear(stampingDate);
      printText("1", startX + 5, y + 6, 9);
      printText("996211", startX + 20, y + 6, 9); // Defined HSN for stamping
      printText(`Stamping fee for the year ${financialYearText}`, startX + 42, y + 6, 9);
      printText(nozzles.toString(), startX + 130, y + 6, 9);
      printText("1500.00", startX + 142, y + 6, 9);
      printText(stampingFee.toFixed(2), startX + 162, y + 6, 9);

      // Row 2 (T.A - Only rendered if > 0)
      if (numAddAmt > 0) {
        printText("2", startX + 5, y + 14, 9);
        printText("", startX + 20, y + 14, 9); // Blank HSN for Conveyance
        printText("Conveyance / Additional T.A.", startX + 42, y + 14, 9);
        printText("1", startX + 130, y + 14, 9);
        printText(numAddAmt.toFixed(2), startX + 142, y + 14, 9);
        printText(numAddAmt.toFixed(2), startX + 162, y + 14, 9);
      }

      y += tableHeight;

      // Totals Box
      doc.rect(startX, y, pageW, 20);
      doc.line(startX + 125, y, startX + 125, y + 20); 
      doc.line(startX + 160, y, startX + 160, y + 20); 
      doc.line(startX + 125, y + 6.6, pageW + startX, y + 6.6); 
      doc.line(startX + 125, y + 13.3, pageW + startX, y + 13.3); 

      // Words Left
      const splitWords = doc.splitTextToSize(`(Rs. ${numberToWords(grandTotal)})`, 120);
      printText(splitWords, startX + 2, y + 10, 9, "helvetica", "bold");

      // Right Side Taxes
      printText("CGST", startX + 140, y + 5, 9, "helvetica", "normal", "right");
      printText("NA", startX + 170, y + 5, 9, "helvetica", "normal", "center");

      printText("SGST", startX + 140, y + 11, 9, "helvetica", "normal", "right");
      printText("NA", startX + 170, y + 11, 9, "helvetica", "normal", "center");

      printText("TOTAL", startX + 140, y + 18, 9, "helvetica", "bold", "right");
      printText(grandTotal.toFixed(2), startX + 170, y + 18, 9, "helvetica", "bold", "center");

      y += 20;
      doc.rect(startX, y, pageW, 15);
      printText("Enclosure:", startX + 2, y + 5, 9, "helvetica", "bold");
      doc.line(startX + 2, y + 5.5, startX + 19, y + 5.5);

      printText(`Original Receipt GRN No. ${grnNo || '______________'}   Dated: ${formatDate(grnDate) || '__________'}`, startX + 22, y + 5, 9);
      printText(`Original Certificate No- ${certNo || '______________'}   Dated: ${formatDate(certDate) || '__________'}`, startX + 22, y + 11, 9);

      // --- SIGNATURE BLOCK (Shifted Down) ---
      // Adding an extra 10mm gap here to push everything lower
      printText("For " + (dealerName || 'Bahar Service Station'), pageW - 20, y + 52, 10, "helvetica", "bold", "center");
      printText("(Name/Signature/Seal of the Dealer)", pageW - 20, y + 58, 9, "helvetica", "normal", "center");

      // ------------------------------------------
      // SEPARATE A4 PAGES FOR ATTACHMENTS (PROMISE BASED FIX)
      // ------------------------------------------
      const fitImageToA4 = async (base64Img) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            doc.addPage();
            const imgRatio = img.width / img.height;
            const pageRatio = A4_WIDTH / A4_HEIGHT;
            
            let finalW, finalH;
            if (imgRatio > pageRatio) {
                finalW = A4_WIDTH - 20; 
                finalH = finalW / imgRatio;
            } else {
                finalH = A4_HEIGHT - 40; 
                finalW = finalH * imgRatio;
            }

            const x = (A4_WIDTH - finalW) / 2;
            const y = (A4_HEIGHT - finalH) / 2;

            doc.addImage(base64Img, 'JPEG', x, y, finalW, finalH);
            resolve();
          };
          img.onerror = () => reject(new Error("Image failed to load."));
          img.src = base64Img;
        });
      };

      // Safely await the image building process
      if (certImg) await fitImageToA4(certImg);
      if (receiptImg) await fitImageToA4(receiptImg);

      // Output
      if (action === 'preview') {
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      } else {
        doc.save(`Reimbursement_${invoiceNo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`);
      }

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Error generating PDF. Make sure your images are fully loaded.");
    } finally {
      setIsGenerating(false);
      setLoadingType(null);
    }
  };

  const clearForm = () => {
    if(window.confirm("Are you sure you want to reset everything?")) {
      try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
      setDealerCode(''); setVendorCode(''); setInvoiceNo(''); setGstin(''); setPanNo('');
      setDealerName(''); setInvoiceDate(''); 
      setGrnNo(''); setGrnDate(''); setCertNo(''); setCertDate('');
      setMpdModel('MIDCO'); setMpdNozzles(''); setAdditionalCharges('0');
      setCertImg(null); setReceiptImg(null); setPumpHeaderImg(null);
      
      // Clear Local Storage
      localStorage.removeItem('wm_vendorCode');
      localStorage.removeItem('wm_gstin');
      localStorage.removeItem('wm_panNo');
      localStorage.removeItem('wm_dealerName');

      if(headerInputRef.current) headerInputRef.current.value = '';
      if(certInputRef.current) certInputRef.current.value = '';
      if(receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  return (
    <div className="app-layout">
      <Navbar title="W&M Reimbursement" />
      
      <main className="main-content" style={{ paddingTop: '10px' }}>
        
        {/* --- 6CM PUMP HEADER UPLOAD --- */}
        <div 
          style={{ 
            height: '226px', 
            width: '100%', 
            backgroundColor: 'var(--surface)',
            border: pumpHeaderImg ? 'none' : '2px dashed var(--border)',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
          }}
        >
          {pumpHeaderImg ? (
            <>
              <img src={pumpHeaderImg} alt="Header" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <button 
                onClick={() => { try { triggerHaptic(ImpactStyle.Light); } catch(e) {}; setPumpHeaderImg(null); }}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <div onClick={() => headerInputRef.current.click()} style={{ cursor: 'pointer', textAlign: 'center', color: 'var(--text-muted)' }}>
              <UploadCloud size={40} style={{ marginBottom: '10px', opacity: 0.5, margin: '0 auto' }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Station Letterhead</p>
              <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>Top 6cm PDF Print Space</p>
            </div>
          )}
          <input type="file" accept="image/*" ref={headerInputRef} onChange={(e) => handleImageUpload(e, setPumpHeaderImg)} style={{ display: 'none' }} />
        </div>

        {/* --- DEALER INFORMATION --- */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <h3><Building size={20} color="var(--primary)" /> Dealer Info</h3>
          </div>

          <div className="grid-2">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Dealer Code</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={dealerCode} onChange={handleDealerCodeChange} placeholder="e.g. 119934" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Vendor Code</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={vendorCode} onChange={(e) => setVendorCode(e.target.value)} placeholder="e.g. 375911" />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '16px' }}>
            <label>Invoice No.</label>
            <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>

          <div className="input-group">
            <label>GSTIN</label>
            <input type="text" value={gstin} onChange={handleGstinChange} placeholder="22AAAAA0000A1Z5" maxLength={15} />
          </div>

          <div className="input-group">
            <label>PAN No (Auto-extracted)</label>
            <input type="text" value={panNo} onChange={(e) => setPanNo(e.target.value)} readOnly style={{ backgroundColor: 'var(--bg-body)' }} />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Dealer Name</label>
            <input type="text" value={dealerName} onChange={(e) => setDealerName(e.target.value)} placeholder="e.g. Bahar Service Station" />
          </div>
        </div>

        {/* --- DATES & ENCLOSURES --- */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <h3><CalendarDays size={20} color="var(--primary)" /> Dates & References</h3>
          </div>
          
          <div className="grid-2" style={{ marginBottom: 15 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Stamping Date (For FY)</label>
              <input type="date" value={stampingDate} onChange={(e) => setStampingDate(e.target.value)} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 15 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Receipt GRN No.</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={grnNo} onChange={(e) => setGrnNo(e.target.value)} placeholder="e.g. 1920252..." />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>GRN Date</label>
              <input type="date" value={grnDate} onChange={(e) => setGrnDate(e.target.value)} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 0 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Certificate No.</label>
              <input type="text" value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder="e.g. WB/15/..." />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Certificate Date</label>
              <input type="date" value={certDate} onChange={(e) => setCertDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* --- EQUIPMENT & PRICING --- */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <h3><Settings2 size={20} color="var(--primary)" /> Equipment & Pricing</h3>
          </div>

          <div className="input-group">
            <label>MPD Make / Model</label>
            <select value={mpdModel} onChange={(e) => setMpdModel(e.target.value)}>
              <option value="MIDCO">MIDCO</option>
              <option value="GILBARCO">GILBARCO</option>
              <option value="WAYNE">WAYNE</option>
              <option value="TOKHEIM">TOKHEIM</option>
              <option value="TATSUNO">TATSUNO</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>No. of Nozzles</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={mpdNozzles} onChange={(e) => setMpdNozzles(e.target.value)} placeholder="0" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Rate per Nozzle (₹)</label>
              <input type="text" value="1500" readOnly style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 20 }}>
            <label>Conveyance / Additional T.A. (₹)</label>
            <input type="text" inputMode="decimal" value={additionalCharges} onChange={(e) => setAdditionalCharges(e.target.value)} placeholder="0.00" />
          </div>

          {/* Live Math Box */}
          <div style={{ background: 'var(--primary-light)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stamping Fee ({nozzles} × ₹1500):</span>
              <span style={{ fontWeight: 600 }}>₹{stampingFee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Additional T.A. / Conveyance:</span>
              <span style={{ fontWeight: 600 }}>₹{numAddAmt.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed var(--border)', fontSize: '1.1rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>GRAND TOTAL:</span>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* --- ATTACHMENTS --- */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '30px' }}>
          <div className="card-head">
            <h3><FileCheck2 size={20} color="var(--primary)" /> Full Page Attachments</h3>
          </div>

          <div className="grid-2" style={{ marginBottom: 0 }}>
            
            {/* Cert Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', padding: '15px', borderRadius: '12px', border: certImg ? '1px solid var(--success)' : '1px dashed var(--border)', position: 'relative' }}>
              {certImg ? (
                <>
                  <img src={certImg} alt="Cert" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button onClick={() => setCertImg(null)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px' }}><X size={14} /></button>
                </>
              ) : (
                <div onClick={() => certInputRef.current.click()} style={{ textAlign: 'center', cursor: 'pointer' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>📄</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>W&M Cert</div>
                </div>
              )}
              <input type="file" accept="image/*" ref={certInputRef} onChange={(e) => handleImageUpload(e, setCertImg)} hidden />
            </div>

            {/* Receipt Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', padding: '15px', borderRadius: '12px', border: receiptImg ? '1px solid var(--success)' : '1px dashed var(--border)', position: 'relative' }}>
              {receiptImg ? (
                <>
                  <img src={receiptImg} alt="Receipt" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button onClick={() => setReceiptImg(null)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px' }}><X size={14} /></button>
                </>
              ) : (
                <div onClick={() => receiptInputRef.current.click()} style={{ textAlign: 'center', cursor: 'pointer' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>🧾</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Receipt</div>
                </div>
              )}
              <input type="file" accept="image/*" ref={receiptInputRef} onChange={(e) => handleImageUpload(e, setReceiptImg)} hidden />
            </div>

          </div>
        </div>

        {/* --- ACTION BUTTONS --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <button onClick={() => generatePDF('preview')} disabled={isGenerating} style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', opacity: isGenerating ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {isGenerating && loadingType === 'preview' ? <><Loader2 className="spinner-mini darker" /> Previewing...</> : <>👁 Preview Invoice</>}
          </button>

          <button onClick={() => generatePDF('download')} disabled={isGenerating} style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', opacity: isGenerating ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {isGenerating && loadingType === 'download' ? <><Loader2 className="spinner-mini darker" /> Downloading...</> : <>⬇ Download PDF</>}
          </button>
          
          <button onClick={clearForm} style={{ padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '12px', background: 'transparent', color: '#ef4444', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            ↺ Reset
          </button>

        </div>

      </main>

      <footer className="app-footer" style={{ marginTop: '20px', textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)' }}> 
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '5px' }}>Made by <strong>Velocity6097</strong></p> 
        <p className="special-thanks" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Special thanks to Mr. Baibhav Bishal Sir for this opportunity</p> 
      </footer> 

    </div>
  );
};

export default ReimbursementInvoice;