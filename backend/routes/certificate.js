const express     = require('express');
const r           = express.Router();
const path        = require('path');
const fs          = require('fs');
const { protect } = require('../middleware/auth');
const Certificate = require('../models/Certificate');

r.use(protect);

r.get('/my', async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.user._id })
      .populate('course', 'title thumbnail category')
      .sort({ issueDate: -1 });
    res.json({ certificates: certs });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

r.get('/download/:certId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId, user: req.user._id });
    if (!cert) return res.status(404).json({ message: 'Certificate not found.' });

    const filePath = path.join(__dirname, '../certificates', cert.pdfPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on server.' });

    res.download(filePath, `NeuralCert-${cert.certificateId}.pdf`);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = r;
