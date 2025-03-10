const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    strikes: { type: Number, default: 0 },
    dues: [{
        name: String,
        amount: Number,
        status: { type: String, default: '❌' }
    }]
});

module.exports = mongoose.model('Profile', profileSchema);
