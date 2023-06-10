const bcrypt = require('bcrypt');
const db = require('../models');

const User = db.user;
const Region = db.region;

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username in the database
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    // Compare the entered password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    // Password is correct, proceed with login logic
    // ...

    res.send({ message: 'Login successful' });
  } catch (err) {
    // Error handling
    res.status(500).send({ message: 'An error occurred' });
  }
};

exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.username || !req.body.password || !req.body.region || !req.body.displayName || !req.body.email || !req.body.phoneNumber) {
      return res.status(400).send({ message: 'Content cannot be empty!' });
    }

    const { username, password, region, displayName, email, phoneNumber } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); 

    const user = new User({ username, password, region, displayName, email, phoneNumber }); // Create the User instance with all properties
    const savedUser = await user.save();

    // Add the username to the region's list of usernames
    const regionData = await Region.findOneAndUpdate(
      { regionName: region },
      { $addToSet: { usernames: username } },
      { upsert: true }
    );

    console.log(savedUser);
    return res.status(201).send(savedUser);
  } catch (err) {
    return res.status(500).send({
      message: err.message || 'Some error occurred while creating the user.'
    });
  }
};



exports.getAll = async (req, res) => {
  try {
    const data = await User.find({});
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: err.message || 'Some error occurred while retrieving users.'
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const username = req.params.username;
    const data = await User.find({ username: username });
    if (data.length === 0) {
      return res.status(404).send({ message: 'User not found' });
    }
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: err.message || 'Some error occurred while retrieving users.'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const username = req.params.username;
    const data = await User.deleteOne({ username: username });
    if (data.deletedCount === 0) {
      return res.status(404).send({ message: 'User not found' });
    }
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: err.message || 'Some error occurred while deleting the user.'
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const username = req.params.username;
    const updates = req.body;
    const data = await User.findOneAndUpdate({ username: username }, updates, { new: true });
    if (!data) {
      return res.status(404).send({ message: 'User not found' });
    }
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: err.message || 'Some error occurred while updating the user.'
    });
  }
};

exports.getUsersByRegion = async (req, res) => {
  try {
    const regionName = req.params.regionName;
    // eslint-disable-next-line no-undef
    const region = await RegionController.getRegionByName(regionName);

    if (!region) {
      return res.status(404).send({ message: 'Region not found' });
    }

    const users = await User.find({ region: region._id });

    if (users.length === 0) {
      return res.status(404).send({ message: 'No users found for the specified region' });
    }

    return res.send(users);
  } catch (err) {
    return res.status(500).send({
      message: 'Error retrieving users by region',
      error: err
    });
  }
};

