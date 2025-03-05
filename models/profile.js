const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    strikes: { type: Number, default: 0 },
    serverName: { type: String },
    highestRole: { type: String }
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
