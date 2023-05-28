require('dotenv').config();
const { MongoClient, GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const Player = require('../models/player');
const ScoreCard = require('../models/scorecard');
const url = `${process.env.MONGO_URL}`;
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');


/**
 * Connect to MongoDB Atlas
 */
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(error => console.error(error));



const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect((err) => {
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
    return;
  }
  console.log('Connected to MongoDB client');
});

const db = client.db();
const bucket = new GridFSBucket(db, {
  bucketName: 'avatars'
});
/**
 *  get player document
 * @param {Sting} username 
 * @returns player document
 */
async function getPlayer(username) {
  try {
    const player = await Player.findOne({ userName: username });
    return player; // Return the player document
  } catch (err) {
    throw new Error("Player not found" + err); // Throw an error to be caught by the caller
  }
}
module.exports.getPlayer = getPlayer;


/**
 * validate login credentials
 * @param {String} username 
 * @param {String} password 
 * @returns 1 if login successful, 0 if password is incorrect, -1 if username is incorrect
 */
module.exports.validateLogin = async (username, password) => {
  const player = await getPlayer(username);
  if (player != null) {
    const result = await bcrypt.compare(password, player.password);
    if (result) {
      return 1;
    } else {
      return 0;
    }
  }
  else {
    return -1;
  }
};



/**
 * creates a new player
 * @param {String} username 
 * @param {String} password 
 * @param {String} displayName 
 * @param {String} avatar 
 * @returns 1 if player created successfully
 */
module.exports.createPlayer = (username, password, displayName, avatar) => {
  const hashedpassword = bcrypt.hashSync(password, 10);
  return addPlayerCard(username, hashedpassword, displayName, avatar).then(() => {
    return addScoreCard(username);
  }).catch((err) => {
    console.error("Error saving player:", err);
    throw err; // reject the Promise with the error
  });
}

/**
 * Adds player document
 * @param {String} username 
 * @param {String} password 
 * @param {String} displayName 
 * @param {String} avatar 
 * @returns 1 if player created successfully
 * @throws Error if player creation fails
 */
function addPlayerCard(username, password, displayName, avatar) {
  let player = new Player({
    userName: username,
    password: password,
    displayName: displayName,
  });
  if (avatar) {
    const uploadStream = bucket.openUploadStream(username);
    uploadStream.end(avatar.buffer);
    player.avatar = {
      data: uploadStream.id.toString(),
      contentType: avatar.mimetype
    };
  }

  return player.save().then(() => {
    console.log("Player saved");
    return 1;
  }).catch((err) => {
    console.error("Error saving player:", err);
    throw err; // reject the Promise with the error
  });
}

/**
 * Creates a ScoreCard document
 * @param {String} username 
 */
function addScoreCard(username) {
  let scoreCard = new ScoreCard({
    username: username,
    totalScore: 0,
    gameCard: []
  });
  scoreCard.save().then(() => {
    return 1;
  }).catch((err) => {
    return new Error("Score Card Updation failure" + err);
  });
}

/**
 * updates game score and high score if score is greater than high score
 * @param {Sting} userName 
 * @param {String} gameName 
 * @param {number} score 
 * @returns 1 if score updated successfully
 */
module.exports.updateScore = (userName, gameName, score) => {
  ScoreCard.findOne({ username: userName }).then((player) => {
    let gameScore = player.gameScores.find(gs => gs.gameName === gameName);
    if (gameScore) {
      // Update the score if it's greater than the high score
      if (score > gameScore.highScore) {
        player.totalScore += score - gameScore.highScore;
        gameScore.highScore = score;
      }
    }
    else {
      gameScore = { gameName: gameName, highScore: score };
      player.gameScores.push(gameScore);
      player.totalScore += score;
    }
    player.save().catch((err) => {
      return new Error("Player updation failure" + err);
    });
  }).catch((err) => {
    return new Error("Player not found" + err);
  });
  return 1;
}


/**
 * 
 * @param {String} userName 
 * @param {String} gameName 
 * @returns high score of the player for the game
 */
module.exports.getHighScore = async (userName, gameName) => {
  try {
    const player = await ScoreCard.findOne({ username: userName });
    if (player) {
      const gameScore = player.gameScores.find((gs) => gs.gameName === gameName);
      if (gameScore) {
        return gameScore.highScore;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  } catch (err) {
    throw new Error("Player not found" + err);
  }
};

/**
 * 
 * @returns top 10 players
 */
module.exports.getTopPlayers = async () => {
  let topPlayers = [];
  try {
    let scorecards = await ScoreCard.find().sort({ totalScore: -1 }).limit(10);
    for (i = 0; i < scorecards.length; i++) {
      let player = await Player.findOne({ userName: scorecards[i].username });
      topPlayers.push({ displayName: player.displayName, score: scorecards[i].totalScore, userName: player.userName });

    }
  }
  catch (err) {
    console.error("Error in getting top players usernames:", err);
    throw err;
  }
  return topPlayers;
}

/**
 * 
 * @param {String} userName 
 * @returns scorecard of the player
 */
module.exports.getScoreCard = async (userName) => {
  const query = { username: userName };

  try {
    const scoreCard = await ScoreCard.findOne(query);

    if (!scoreCard || !scoreCard.gameScores || scoreCard.gameScores.length === 0) {
      return []; // Return an empty list when scoreCard has no elements
    }

    const gameScores = scoreCard.gameScores.map((score) => {
      return { gameName: score.gameName, highScore: score.highScore };
    });
    return gameScores;
  } catch (err) {
    console.error("Error in getting scorecard:", err);
    throw err;
  }
};



/**
 * getAvatar of the player
 * @param {String} userName
 * @returns avatar of the player
 * @throws Error if player not found
 * 
 */
module.exports.getAvatar = async (userName) => {
 try{

   const player = await getPlayer(userName);
   if (!player || !player.avatar || !player.avatar.data) {
     throw new Error('Avatar not found');
    }
    const downloadStream = await bucket.openDownloadStream(new ObjectId(player.avatar.data));
    return {downloadStream: downloadStream, contentType: player.avatar.contentType};
  }
  catch(err){
    console.error("Error in getting avatar:", err);
    throw err;
  }

}


// module.exports.updatePlayer = async (userName, displayName, password, avatar) => {
//   try {
//     const player = await getPlayer(userName);
//     if (!player) {
//       throw new Error('Player not found');
//     }
//     if(displayName && displayName !== ''){
//       player.displayName = displayName;
//     }
//     if(password && password !== ''){
//       player.password = password;
//     }
//     if(avatar){
//       // Delete previous avatar files and chunks
//       if (player.avatar && player.avatar.data) {
//         const prevAvatarId = new ObjectId(player.avatar.data);
//         await bucket.delete(prevAvatarId);
//       }
//       // Upload new avatar
//       const uploadStream = bucket.openUploadStream(userName);
//       uploadStream.end(avatar.buffer);
//       player.avatar = {
//         data: uploadStream.id.toString(),
//         contentType: avatar.mimetype
//       };
//     }
//     await player.save();
//     return 1;
//   } catch (err) {
//     console.error("Error in updating player:", err);
//     throw err;
//   }
// };


module.exports.updateAvatar = async (userName, avatar) => {
  try {
    const player = await getPlayer(userName);
    if (!player) {
      throw new Error('Player not found');
    }
    // Delete previous avatar files and chunks
    if (player.avatar && player.avatar.data) {
      const prevAvatarId = new ObjectId(player.avatar.data);
      await bucket.delete(prevAvatarId);
    }
    // Upload new avatar
    const uploadStream = bucket.openUploadStream(userName);
    uploadStream.end(avatar.buffer);
    player.avatar = {
      data: uploadStream.id.toString(),
      contentType: avatar.mimetype
    };
    await player.save();
    return 1;
  } catch (err) {
    console.error("Error in updating avatar:", err);
    throw err;
  }
}

module.exports.updateDisplayName = async (userName, displayName) => {
  try {
    const player = await getPlayer(userName);
    if (!player) {
      throw new Error('Player not found');
    }
    player.displayName = displayName;
    await player.save();
    return 1;
  } catch (err) {
    console.error("Error in updating display name:", err);
    throw err;
  }
}

module.exports.updatePassword = async (userName, password) => {
  try {
    const player = await getPlayer(userName);
    if (!player) {
      throw new Error('Player not found');
    }
    player.password = password;
    await player.save();
    return 1;
  } catch (err) {
    console.error("Error in updating password:", err);
    throw err;
  }
}





