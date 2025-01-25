const countryCrtl = require('../controllers/country')
const Auth = require('../middlewares')

const router = require('express').Router()

router.get('/countries', Auth, countryCrtl.getAll)


module.exports = router