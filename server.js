const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const chatRoute = require('./routes/chat');
const resumeRoute = require('./routes/resume');
const pdfRoute = require('./routes/pdf');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/chat', chatRoute);
app.use('/api/resume', resumeRoute);
app.use('/api/pdf', pdfRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});