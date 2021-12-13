const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/challenge').post(authController.createChallenge);
router.route('/sse/:challenge').get(authController.waitChallengeValidation);
router.route('/vp').post(authController.submitVerifiablePresentation);

module.exports = router;
