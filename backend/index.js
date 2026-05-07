const express = require('express');
const app = express();
const cors = require('cors');

require('dotenv').config();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const router = require('./routers/routers.js');
app.use('/api', router);

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));