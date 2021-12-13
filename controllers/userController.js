const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getMe = (req, res, next) => {
  req.params.did = req.did;
  next();
};

exports.getUser = catchAsync(async (req, res, next) => {
  var user = await User.findOne({ did: req.params.did });
  if (!user) {
    return next(new AppError('No user found with that DID', 404));
  }

  res.status(200).json(user);
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  var users = await User.find();
  if (!users) {
    return next(new AppError('No user found', 404));
  }

  res.status(200).json(users);
});

exports.isAdmin = catchAsync(async (req, res, next) => {
  var isAdmin = false;
  const admins = process.env.ADMINS_DID.split(',');
  if (admins.indexOf(req.params.did.split(':')[2]) >= 0) isAdmin = true;

  res.status(200).json({
    isAdmin,
  });
});
