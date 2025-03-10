const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    emoji: { type: String, required: true },
    count: { type: Number, default: 0 }
});

const storageSchema = new mongoose.Schema({
    guildId: { type: String, required: true }, // Ensure storages are linked to a guild
    name: { type: String, required: true },
    color: { type: String, required: true },
    categories: [categorySchema],
    channelId: { type: String, required: true },
    modifyRole: { type: String, required: true }
});

const configSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    storages: [storageSchema],
    modRole: { type: String, required: true }
});

module.exports = mongoose.model('Config', configSchema);
