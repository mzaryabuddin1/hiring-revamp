require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const http = require('http')

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(cors())

const morgan = require('morgan');
app.use(morgan('dev'));


const uploads = path.join(__dirname, 'public/');
app.use('/public', express.static(uploads));


app.get("/", (req, res) => { res.status(200).json({ msg: "Live!" }) })

app.use('/auth', require('./routes/authRoutes'))

const server = http.createServer(app);

mongoose.connect(process.env.DBURI, { dbName: process.env.DBNAME }).then(() => { console.log('Mongo DB Connected') }).catch((error) => { console.log('Unable To Connect') })

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server is running on port ', PORT);
});