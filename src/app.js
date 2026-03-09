const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(' hello banglorre 2  ');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: '3.0', automated: true });
});

app.listen(3000, () => {
  console.log('Server running - FULL AUTOMATION ENABLED!');
});
