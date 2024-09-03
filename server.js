const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const routes = require('./router/index');

app.use(routes);

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
