const express = require('express');
const { check, validationResult } = require('express-validator/check');

const User = require('./../models/User');
const Contact = require('./../models/Contact');
const auth = require('./../middleware/auth');

const router = express.Router();

//@route   GET /api/contacts
//@desc    Get all users contatcs
//@access  Private
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort({
      date: -1
    });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route   POST /api/contacts
//@desc    Add new contact
//@access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Please add a name')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    //validation Check
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      res.status(400).json({ msg: errors.array() });
    }

    //Adding Contact
    try {
      const { name, email, phone, type } = req.body;

      const newContact = new Contact({
        name,
        email,
        phone,
        type,
        user: req.user.id
      });

      const contact = await newContact.save();

      res.json(contact);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route   Put /api/contacts/:id
//@desc    Update a contact
//@access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone, type } = req.body;

  //Building contacts
  const contactFields = {};
  if (name) contactFields.name = name;
  if (email) contactFields.email = email;
  if (phone) contactFields.phone = phone;
  if (type) contactFields.type = type;

  console.log(contactFields);

  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) return res.status(404).json({ msg: 'Contact not found' });

    //Make sure user owns contact
    if (contact.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });

    //Updating Contact
    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields },
      { new: true }
    );

    res.json(contact);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route   DELETE /api/contacts/:id
//@desc    Delete a contact
//@access  Private
router.delete('/:id', auth, async (req, res) => {
  //Removing Contact
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) return res.status(404).json({ msg: 'Contact not found' });

    //Make sure user owns contact
    if (contact.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });

    //Updating Contact
    await Contact.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Contact removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
