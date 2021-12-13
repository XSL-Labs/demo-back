const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const mydidAuth = require('@xsl-labs/mydid-auth');

const Challenge = require('../models/challengeModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  listenChallengeValidated,
  listenChallengeTreating,
  listenChallengeExpired,
  closeListenerChallengeValidated,
  closeListenerChallengeTreating,
  closeListenerChallengeExpired,
} = require('../utils/eventHandler');

exports.waitChallengeValidation = catchAsync(async (req, res, next) => {
  if (!req.params.challenge)
    return next(new AppError('No challenge found in params', 400));

  var challenge = await Challenge.findOne({ id: req.params.challenge });
  if (!challenge) {
    return next(new AppError('No challenge found with this id', 404));
  }

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders(); // flush the headers to establish SSE with client
  const data = { status: 'waiting' };
  res.write(`data: ${JSON.stringify({ data })}\n\n`);
  res.flush();

  listenChallengeValidated(req.params.challenge, (userDid) => {
    const token = signToken(userDid);
    const data = {
      status: 'validated',
      challenge: req.params.challenge,
      token,
    };
    res.write(`data: ${JSON.stringify({ data })}\n\n`);
    res.flush();
  });

  listenChallengeTreating(req.params.challenge, () => {
    const data = { status: 'treating' };
    res.write(`data: ${JSON.stringify({ data })}\n\n`);
    res.flush();
  });

  listenChallengeExpired(req.params.challenge, (challenge) => {
    const data = { status: 'expired', message: challenge.message };
    res.write(`data: ${JSON.stringify({ data })}\n\n`);
    res.flush();
  });

  // If client closes connection, stop sending events
  res.on('close', () => {
    console.log('SSE connection dropped by client');
    closeListenerChallengeValidated(req.params.challenge);
    closeListenerChallengeTreating(req.params.challenge);
    closeListenerChallengeExpired(req.params.challenge);
    res.end();
  });
});

exports.createChallenge = catchAsync(async (req, res, next) => {
  const customQuery =
    (req.query.signin ? 'signin' : '') +
    (req.query.signup ? 'signup' : '') +
    (req.query.onlysignup ? 'onlysignup' : '');
  const verifiableCredentials =
    process.env.VERIFIABLE_CREDENTIALS.length == 0 || req.query.signin
      ? []
      : process.env.VERIFIABLE_CREDENTIALS.split(',');
  const callbackUrl =
    process.env.CALLBACK_URL +
    (customQuery.length > 0 ? `?${customQuery}=1` : '');
  const challenge = crypto.randomBytes(32).toString('hex');

  var VPRequest = mydidAuth.createVPRequest(
    challenge,
    callbackUrl,
    verifiableCredentials
  );

  await Challenge.create({
    id: VPRequest.challenge,
    verifiableCredentials: VPRequest.verifiableCredentials,
    query: VPRequest.query,
    purpose: customQuery,
  });

  console.log(`Create new challenge with id : ${VPRequest.challenge}`);

  res.status(200).json(VPRequest);
});

exports.submitVerifiablePresentation = catchAsync(async (req, res, next) => {
  if (!req.body) return next(new AppError('No body found', 400));

  const verifiablePresentation = req.body;
  var challenge = await Challenge.findOne({
    id: verifiablePresentation.proof.challenge,
  });

  try {
    mydidAuth.validateVPConsistency(verifiablePresentation);
  } catch (err) {
    challenge.message = "Can't validate verifiable presentation consistency";
    challenge.state = 'expired';
    await challenge.save();
    return next(
      new AppError(
        "Can't validate verifiable presentation consistency : " + err,
        400
      )
    );
  }

  if (
    (challenge.purpose == 'signup' && !req.query.signup) ||
    (challenge.purpose == 'signin' && !req.query.signin) ||
    (challenge.purpose == 'onlysignup' && !req.query.onlysignup)
  ) {
    challenge.state = 'expired';
    challenge.message = 'Bad query in callback URL';
    await challenge.save();
    return next(new AppError('Bad query in callback URL', 401, 0));
  }

  if (
    req.query.signup &&
    (await User.findOne({ did: verifiablePresentation.id }))
  ) {
    challenge.state = 'expired';
    challenge.message = "DID already exists, can't sign up";
    await challenge.save();
    return next(new AppError('DID already exists', 401, 1000));
  }

  if (
    req.query.signin &&
    !(await User.findOne({ did: verifiablePresentation.id }))
  ) {
    challenge.state = 'expired';
    challenge.message = "DID does not exist, can't sign in";
    await challenge.save();
    return next(new AppError('DID does not exist', 401, 1001));
  }

  // check if VC are corresponding
  for (var verifiableCredential of challenge.verifiableCredentials) {
    var hasVerifiableCredential = false;
    for (var verifiableCredentialVP of verifiablePresentation.verifiableCredential)
      if (
        verifiableCredentialVP.credentialSubject.hasOwnProperty(
          verifiableCredential
        )
      )
        hasVerifiableCredential = true;
    if (!hasVerifiableCredential) {
      challenge.state = 'expired';
      challenge.message = "VCs not corresponding, can't sign up";
      await challenge.save();
      return next(new AppError('VCs not corresponding', 400));
    }
  }

  challenge.state = 'treating';
  challenge.verifiablePresentation = verifiablePresentation;
  await challenge.save();
  res.status(200).json({
    status: 'success',
    data: {},
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  var token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in ! Please log in to get access', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findOne({ did: decoded.did });
  if (!currentUser)
    return next(
      new AppError('The user belonging this token does no longer exist.')
    );

  req.did = decoded.did;
  next();
});

exports.restrictToAdmin = () => (req, res, next) => {
  const admins = process.env.ADMINS_DID.split(',');
  if (admins.indexOf(req.did.split(':')[2]) == -1)
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  next();
};

const signToken = (did) =>
  jwt.sign({ did }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
