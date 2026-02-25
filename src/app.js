const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('GitOps Pipeline Working 🚀🔥 Version: 2.0 - Updated!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: '2.0' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000 - Version 2.0');
});
