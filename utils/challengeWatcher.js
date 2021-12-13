const mydidAuth = require('@xsl-labs/mydid-auth');
const Challenge = require('../models/challengeModel');
const User = require('../models/userModel');
const {
  emitChallengeValidated,
  emitChallengeTreating,
  emitChallengeExpired,
} = require('./eventHandler');

const challengeStream = Challenge.watch([], { fullDocument: 'updateLookup' });

challengeStream.on('change', async (data) => {
  if (data.operationType == 'update' && data.fullDocument.state == 'treating') {
    console.log(`Treating challenge with id : ${data.fullDocument.id}`);
    emitChallengeTreating(data.fullDocument);

    const verifiablePresentation = data.fullDocument.verifiablePresentation;

    try {
      await mydidAuth.validateVPAuthenticity(verifiablePresentation);
    } catch (err) {
      console.log(err);
      var challenge = await Challenge.findOne({ id: data.fullDocument.id });
      challenge.message = "Can't validate verifiable presentation authenticity";
      challenge.state = 'expired';
      await challenge.save();
      return;
    }

    var challenge = await Challenge.findOne({ id: data.fullDocument.id });

    if (
      challenge.purpose &&
      (challenge.purpose == 'signup' || challenge.purpose == 'onlysignup') &&
      !(await User.findOne({ did: verifiablePresentation.id }))
    ) {
      await User.create({
        did: verifiablePresentation.id,
        verifiableCredentials: verifiablePresentation.verifiableCredential,
      });
    }

    challenge.userDid = verifiablePresentation.id;
    challenge.state = 'validated';
    await challenge.save();
  }
  if (
    data.operationType == 'update' &&
    data.fullDocument.state == 'validated'
  ) {
    console.log(`Challenge validated with id : ${data.fullDocument.id}`);
    emitChallengeValidated(data.fullDocument, data.fullDocument.userDid);
  }
  if (data.operationType == 'update' && data.fullDocument.state == 'expired') {
    console.log(`Challenge expired with id : ${data.fullDocument.id}`);
    emitChallengeExpired(data.fullDocument);
  }
});
