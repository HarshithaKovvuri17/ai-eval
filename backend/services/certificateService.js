const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const CERT_DIR = path.join(__dirname, '../certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

exports.generateCertificate = ({ userName, courseName, level1Score, level2Score, issueDate }) =>
  new Promise((resolve, reject) => {
    const certId   = uuidv4().replace(/-/g,'').slice(0,10).toUpperCase();
    const fileName = `CERT-${certId}.pdf`;
    const filePath = path.join(CERT_DIR, fileName);

    const doc    = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const W = 841.89, H = 595.28, cx = W / 2;

    // 1. BACKGROUND (Pure Deep Navy, No Messy Textures)
    doc.rect(0, 0, W, H).fill('#050818'); 

    // 2. DOUBLE BORDER (Only the frame lines, NO big vertical internal side branches)
    doc.save().lineWidth(2).rect(16, 16, W - 32, H - 32).stroke('#3a44c8').restore();
    doc.save().lineWidth(0.8).rect(23, 23, W - 46, H - 46).stroke('#2a3098').restore();

    // 3. CORNER PLATINGS (Diamonds and precise corner bracket arms)
    [
      { x: 16,    y: 16,    hd:  1, vd:  1 },
      { x: W-16,  y: 16,    hd: -1, vd:  1 },
      { x: 16,    y: H-16,  hd:  1, vd: -1 },
      { x: W-16,  y: H-16,  hd: -1, vd: -1 },
    ].forEach(({ x, y, hd, vd }) => {
      // Small diamonds at exact corners
      doc.save().translate(x, y).rotate(45).rect(-10, -10, 20, 20).fill('#2a35a0').restore();
      doc.save().translate(x, y).rotate(45).rect(-6, -6, 12, 12).fill('#5a6ce0').restore();

      // Precise tech brackets extending from commas
      doc.save().lineWidth(1.5).strokeColor('#2a35a0');
      doc.moveTo(x + hd * 18, y).lineTo(x + hd * 80, y).stroke();
      doc.moveTo(x + hd * 80, y - 4).lineTo(x + hd * 80, y + 4).stroke(); // end cap horizontal
      doc.moveTo(x, y + vd * 18).lineTo(x, y + vd * 80).stroke();
      doc.moveTo(x - 4, y + vd * 80).lineTo(x + 4, y + vd * 80).stroke(); // end cap vertical
      doc.restore();
    });

    // 4. FLOATING GLOW STARS
    const glows = [ {x: 45, y: 160}, {x: W-45, y: H-160}, {x: 35, y: H-80}, {x: W-35, y: 80} ];
    glows.forEach(g => {
       doc.save().fillOpacity(0.3).circle(g.x, g.y, 4).fill('#6a80ff').restore();
       doc.save().fillOpacity(1.0).circle(g.x, g.y, 1.5).fill('#ffffff').restore();
    });

    // 5. RASTER LOGO (True Transparent Aditya Logo Image from user)
    const logoW = 220;
    const logoY = 32;
    const logoPath = path.join(__dirname, '../assets/logo_transparent.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, cx - (logoW / 2), logoY, { width: logoW });
    }

    // 6. BRAND BADGE
    doc.font('Helvetica').fontSize(10).fillColor('#4a60d0')
       .text('+!  NEURALCERT  ·  AI EVALUATION SYSTEM', 0, 152,
             { align: 'center', characterSpacing: 2.5 });

    // 7. CERTIFICATE TITLE (Clean, white, properly spaced below text)
    doc.font('Helvetica-Bold').fontSize(62).fillColor('#ffffff')
       .text('CERTIFICATE', 0, 168, { align: 'center', characterSpacing: 0.5 });

    // Sharp thin neon line immediately below CERTIFICATE
    doc.moveTo(cx - 240, 245).lineTo(cx + 240, 245).lineWidth(0.8).stroke('#2a3080');

    // ── "OF ACHIEVEMENT" ──
    doc.font('Helvetica').fontSize(11).fillColor('#3a4ec0')
       .text('O F   A C H I E V E M E N T', 0, 258,
             { align: 'center', characterSpacing: 6 });

    // 8. CERTIFICATE BODY
    doc.font('Helvetica').fontSize(12).fillColor('#788aa8')
       .text('This is to certify that', 0, 305, { align: 'center' });

    doc.font('Helvetica-Bold').fontSize(42).fillColor('#ffffff')
       .text(userName, 0, 327, { align: 'center' });

    doc.font('Helvetica').fontSize(12).fillColor('#788aa8')
       .text('has successfully completed all evaluation rounds of', 0, 385, { align: 'center' });

    doc.font('Helvetica-Bold').fontSize(24).fillColor('#4050e0')
       .text(courseName, 0, 410, { align: 'center' });

    // 9. SCORES & FOOTER SECTION
    doc.moveTo(cx - 210, 440).lineTo(cx + 210, 440).lineWidth(0.8).stroke('#1a2060');

    // Tiny Vertical Divider Strip exactly in center
    doc.moveTo(cx, 445).lineTo(cx, 475).lineWidth(0.8).stroke('#2a3080');

    const gap = 15; // Tight padding to the vertical strip

    // Left Block (Round 1) -> RIGHT aligned to touch center pole
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#c8d4ee')
       .text(`Round 1 Score: ${level1Score}%`, 0, 448, { width: cx - gap, align: 'right' });
    
    const dateStr = new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.font('Helvetica').fontSize(9).fillColor('#506088')
       .text(`Issued: ${dateStr}`, 0, 464, { width: cx - gap, align: 'right' });

    // Right Block (Round 2) -> LEFT aligned to touch center pole
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#c8d4ee')
       .text(`Round 2 Score: ${level2Score}%`, cx + gap, 448, { width: cx - gap, align: 'left' });
    doc.font('Helvetica').fontSize(9).fillColor('#506088')
       .text(`Cert ID: ${certId}`, cx + gap, 464, { width: cx - gap, align: 'left' });

    // 10. VERIFIED SEAL (Wavy Flower Scalloped Edge - NOT Gears)
    const sealX = cx, sealY = 530;

    doc.save().fillColor('#050818').strokeColor('#3a44c0').lineWidth(2);
    const numPoints = 24;
    const outerR = 38, innerR = 33;
    doc.moveTo(sealX + outerR, sealY);
    for (let i = 1; i <= numPoints * 2; i++) {
        const rad = i * Math.PI / numPoints;
        const r = i % 2 === 0 ? outerR : innerR;
        doc.lineTo(sealX + Math.cos(rad) * r, sealY + Math.sin(rad) * r);
    }
    doc.closePath().fillAndStroke().restore();

    doc.circle(sealX, sealY, 28).lineWidth(1).stroke('#2a3080');

    // Inner small Checkmark Badge
    const shY = sealY - 12;
    doc.save()
       .moveTo(sealX, shY - 5).lineTo(sealX + 5, shY - 3).lineTo(sealX + 5, shY + 3)
       .lineTo(sealX, shY + 7).lineTo(sealX - 5, shY + 3).lineTo(sealX - 5, shY - 3)
       .closePath().lineWidth(1.2).stroke('#4050e0').restore();
    doc.moveTo(sealX - 2, shY).lineTo(sealX, shY + 2).lineTo(sealX + 3, shY - 1)
       .lineWidth(1).stroke('#7080ff');

    doc.font('Helvetica-Bold').fontSize(7).fillColor('#5a6ce0')
       .text('VERIFIED', sealX - 20, sealY + 2, { width: 40, align: 'center' })
       .text('&', sealX - 20, sealY + 11, { width: 40, align: 'center' });

    const laurelSegs = [
      { x1: -32, y1: 18, x2: -24, y2: 14 }, { x1: -28, y1: 24, x2: -16, y2: 18 }, { x1: -20, y1: 30, x2: -10, y2: 24 },
      { x1:  32, y1: 18, x2:  24, y2: 14 }, { x1:  28, y1: 24, x2:  16, y2: 18 }, { x1:  20, y1: 30, x2:  10, y2: 24 },
    ];
    laurelSegs.forEach(({ x1, y1, x2, y2 }) => {
      doc.moveTo(sealX + x1, sealY + y1).lineTo(sealX + x2, sealY + y2).lineWidth(1.3).stroke('#3a44a0');
    });

    // 11. SIGNATURE BLOCK (Cursive, elegant)
    const sigCX = W - 170;
    const sigY  = 495;

    doc.font('Times-Italic').fontSize(32).fillColor('#d0d8f8')
       .text('Y.D.Prasad', sigCX - 90, sigY - 12, { width: 180, align: 'center' });

    const sigLineW = 140;
    doc.moveTo(sigCX - sigLineW/2, sigY + 26).lineTo(sigCX + sigLineW/2, sigY + 26)
       .lineWidth(0.8).stroke('#3a44a0');

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#a0a8c8')
       .text('Y. DURGA PRASAD', sigCX - 80, sigY + 34, { width: 160, align: 'center' });

    doc.font('Helvetica').fontSize(8).fillColor('#506088')
       .text('PROFESSOR, COMPUTER SCIENCE', sigCX - 120, sigY + 48, { width: 240, align: 'center' })
       .text('ADITYA UNIVERSITY',           sigCX - 120, sigY + 60, { width: 240, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve({ certId, filePath, fileName }));
    stream.on('error', reject);
  });
