const express = require('express');
const { check, validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('./../models/User');

const router = express.Router();

//@route   POST /api/users
//@desc    Register a user
//@access  Public
router.post(
  '/',
  [
    check('name', 'Please add a name')
      .not()
      .isEmpty(),
    check('email', 'Please add a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    //validation Check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    try {
      //Saving User in Database
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });
      if (user) {
        res.status(400).json({ msg: 'User already exists' });
      }

      //Adding User
      user = new User({ name, email, password });

      //Hashing Password
      const salt = await bcrypt.genSalt(8);
      user.password = await bcrypt.hash(password, salt);

      //Saving User
      await user.save();

      //Jwt token generation
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
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
