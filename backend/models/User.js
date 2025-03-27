const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  attempts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attempt' }]
});
module.exports = mongoose.model('User', userSchema);