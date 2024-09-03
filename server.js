const express = require('express');
const bodyParser = require('body-parser')
import router from './routes/index';

const app = express();
require('dotenv').config();
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.use('/', router);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

module.exports = app;