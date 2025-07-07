const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  user_created: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Task', TaskSchema);