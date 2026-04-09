const { generateCertificate } = require('./services/certificateService');

generateCertificate({
  userName: 'Kovvuri Harshitha',
  courseName: 'Java',
  level1Score: '100',
  level2Score: '100',
  issueDate: new Date()
})
  .then(cert => {
    console.log('✅ Generated correctly:', cert.filePath);
  })
  .catch(err => {
    console.error('❌ Failed:', err);
  });
