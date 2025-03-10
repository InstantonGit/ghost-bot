const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    strikes: { type: Number, default: 0 },
    dues: [{
        name: String,
        amount: Number,
        status: { type: String, default: '❌' }
    }],
    ignoreRoles: [{ type: String }] // New field for ignoring roles
});

module.exports = mongoose.model('Profile', profileSchema);
