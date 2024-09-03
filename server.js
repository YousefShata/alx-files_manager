const express = require('express');
const routes = require('./routes/index');

const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

module.exports = app;