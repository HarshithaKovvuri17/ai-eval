const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
const Course = require('./models/Course');
const { generateCertificate } = require('./services/certificateService');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function regen() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-eval');
  console.log('MongoDB connected');

  const certs = await Certificate.find().populate('user course');
  for (let cert of certs) {
    if (!cert.user || !cert.course) continue;

    const oldPath = path.join(__dirname, 'certificates', cert.pdfPath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    const pdfData = await generateCertificate({
      userName: cert.user.name,
      courseName: cert.course.title,
      level1Score: cert.level1Score,
      level2Score: cert.level2Score,
      issueDate: cert.issueDate
    });

    cert.certificateId = pdfData.certId;
    cert.pdfPath = pdfData.fileName;
    cert.downloadUrl = `/certificates/${pdfData.fileName}`;
    await cert.save();
    console.log(`Re-generated: ${pdfData.fileName}`);
  }
  
  console.log('Done');
  process.exit(0);
}

regen().catch(console.error);
