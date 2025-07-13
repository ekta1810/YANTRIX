const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Create Task
router.post('/', auth, async (req, res) => {
  try {
    const { name, status, users, project } = req.body;

    const task = new Task({
      name,
      status,
      users,
      project,
      user_created: req.user._id,
    });

    await task.save();

    // Optionally push the task into the project's tasks array
    if (project) {
      await Project.findByIdAndUpdate(project, { $push: { tasks: task._id } });
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/my', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      users: req.user._id
    })
      .populate('users', 'email role')
      .populate('project')
      .populate('user_created', 'email role');

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching user tasks:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get All Tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({users:req.user._id}).populate('users').populate('project').populate('user_created');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Task
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, status, users, project } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { name, status, users, project },
      { new: true }
    );

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
