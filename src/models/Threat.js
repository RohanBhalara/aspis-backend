import mongoose from 'mongoose';

const threatSchema = new mongoose.Schema({
    id: Number,
    urlhaus_reference: String,
    url: { type: String, required: true, unique: true },
    threat: String,
    tags: [String],
    url_status: String,
    host: String,
    date_added: Date,
    blacklists: {
        spamhaus_dbl: String,
        surbl: String
    },
    reporter: String,
    larted: Boolean,
    source: String,
    cachedAt: { type: Date, default: Date.now }
});

const Threat = mongoose.model('Threat', threatSchema);

export default Threat;