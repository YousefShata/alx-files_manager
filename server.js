const express = require('express');
import router from './routes/index';

const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.use('/', router);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

module.exports = app;