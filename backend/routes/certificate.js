const express     = require('express');
const r           = express.Router();
const path        = require('path');
const fs          = require('fs');
const { protect } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const User        = require('../models/User');
const Course      = require('../models/Course');
const { generateCertificate } = require('../services/certificateService');

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

    // Auto-regenerate if PDF file is missing (e.g. after container recreation)
    if (!fs.existsSync(filePath)) {
      console.log(`Certificate PDF missing for ${cert.certificateId}, regenerating...`);
      try {
        const user   = await User.findById(cert.user);
        const course = await Course.findById(cert.course);
        if (!user || !course) return res.status(404).json({ message: 'User or course data missing for regeneration.' });

        const certData = await generateCertificate({
          userName:    user.name,
          courseName:  course.title,
          level1Score: cert.level1Score,
          level2Score: cert.level2Score,
          issueDate:   cert.issueDate,
        });

        // Update the DB record with the new file path
        cert.pdfPath = certData.fileName;
        await cert.save();

        return res.download(certData.filePath, `NeuralCert-${cert.certificateId}.pdf`);
      } catch (regenErr) {
        console.error('Certificate regeneration failed:', regenErr.message);
        return res.status(500).json({ message: 'Certificate file missing and regeneration failed.' });
      }
    }

    res.download(filePath, `NeuralCert-${cert.certificateId}.pdf`);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = r;
