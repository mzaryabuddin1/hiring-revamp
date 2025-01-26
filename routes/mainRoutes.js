const categoryCrtl = require('../controllers/category')
const countryCrtl = require('../controllers/country')
const jobCrtl = require('../controllers/job')
const Auth = require('../middlewares')

const router = require('express').Router()

router.get('/countries', Auth, countryCrtl.getAll)

router.post('/job', Auth, jobCrtl.create)
router.get('/jobs', Auth, jobCrtl.getAll)
router.get('/job/:id', Auth, jobCrtl.getOne)
router.patch('/job', Auth, jobCrtl.update)


router.get('/categories', Auth, categoryCrtl.getAll)

module.exports = router