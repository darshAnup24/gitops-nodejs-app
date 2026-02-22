const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('GitOps Pipeline Working 🚀 Version: ' + (process.env.VERSION || '1.0'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
