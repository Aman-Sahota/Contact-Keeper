const express = require('express');
const { check, validationResult } = require('express-validator/check');
const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const auth = require('./../middleware/auth');
const User = require('./../models/User');

const router = express.Router();

//@route   GET /api/auth
//@desc    Get logged in user
//@access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

//@route   POST /api/auth
//@desc    Auth user & get token
//@access  Private
router.post(
  '/',
  [
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    //Validation
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      res.status(400).json({ msg: errors.array() });
    }

    const { email, password } = req.body;
    try {
      //Login User(Finding User)
      let user = await User.findOne({ email });
      if (!user) {
        res.status(400).json({ msg: 'Invalid Credentials' });
      }

      //Checking Password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ msg: 'Invalid Credentials' });
      }

      //Token Generation
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(payload, config.get('jwtSecret'), (err, token) => {
        if (err) {
          throw new err();
        }
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
