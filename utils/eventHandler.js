const EventEmitter = require('events');

const emitter = new EventEmitter();

exports.emitChallengeValidated = (challenge, userDid) => {
  emitter.emit('challengeValidated' + challenge.id, userDid);
};

exports.emitChallengeTreating = (challenge) => {
  emitter.emit('challengeTreating' + challenge.id);
};

exports.emitChallengeExpired = (challenge) => {
  emitter.emit('challengeExpired' + challenge.id, challenge);
};

exports.listenChallengeValidated = (id, next) => {
  emitter.on('challengeValidated' + id, function listener(arg1) {
    next(arg1);
  });
};

exports.listenChallengeTreating = (id, next) => {
  emitter.on('challengeTreating' + id, next);
};

exports.listenChallengeExpired = (id, next) => {
  emitter.on('challengeExpired' + id, function listener(arg1) {
    next(arg1);
  });
};

exports.closeListenerChallengeValidated = (id) => {
  emitter.removeAllListeners('challengeValidated' + id);
};

exports.closeListenerChallengeTreating = (id) => {
  emitter.removeAllListeners('challengeTreating' + id);
};

exports.closeListenerChallengeExpired = (id) => {
  emitter.removeAllListeners('challengeExpired' + id);
};
