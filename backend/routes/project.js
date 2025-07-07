const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Create Project
router.post('/', auth, async (req, res) => {
  try {
    const { name, users = [] } = req.body;
    const project = new Project({
      name,
      users,
      user_created: req.user._id,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user_created: req.user._id }).populate('users').populate('tasks').populate('user_created');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
1
// Update Project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, users } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, users },
      { new: true }
    );

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      users: req.user._id
    })
      .populate('users', 'email role')
      .populate('tasks')
      .populate('user_created', 'email role');

    res.json(projects);
  } catch (err) {
    console.error("Error fetching user projects:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete Project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
