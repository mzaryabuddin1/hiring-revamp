const countryCrtl = require('../controllers/country')
const jobCrtl = require('../controllers/job')
const Auth = require('../middlewares')

const router = require('express').Router()

router.get('/countries', Auth, countryCrtl.getAll)

router.post('/job', Auth, jobCrtl.create)
router.get('/jobs', Auth, jobCrtl.getAll)
router.get('/job', Auth, jobCrtl.getOne)
router.patch('/countries', Auth, jobCrtl.update)


module.exports = router