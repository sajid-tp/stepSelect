const Address = require('../../models/address');
const User = require('../../models/user')
// GET /addresses - List Addresses
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /addresses - Create New Address
const createAddress = async (req, res) => {
  try {
    const {
      name,
      addressType,
      detailedAddress,
      country,
      city,
      pinCode,
      phoneNumber,
      email,
      isDefault,
    } = req.body;

    if (!name || !detailedAddress || !country || !city || !pinCode || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 1. name — 3 to 50 characters
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 25) {
      return res.status(400).json({ success: false, message: 'Name must be between 3 and 25 characters' });
    }

    // 2. addressType — only allow specific values (optional field, defaults later)
    const allowedTypes = ['Home', 'Work', 'Other'];
    if (addressType && !allowedTypes.includes(addressType)) {
      return res.status(400).json({ success: false, message: 'Address type must be Home, Work, or Other' });
    }

    // 3. detailedAddress — 10 to 200 characters
    const trimmedAddress = detailedAddress.trim();
    if (trimmedAddress.length < 10 || trimmedAddress.length > 200) {
      return res.status(400).json({ success: false, message: 'Detailed address must be between 10 and 200 characters' });
    }

    // 4. country — 2 to 56 characters, letters and spaces only
    const countryRegex = /^[A-Za-z\s]{2,56}$/;
    if (!countryRegex.test(country.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid country name' });
    }

    // 5. city — 2 to 56 characters, letters and spaces only
    const cityRegex = /^[A-Za-z\s]{2,56}$/;
    if (!cityRegex.test(city.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid city name' });
    }

    // 6. pinCode — digits only, 4 to 10 characters (covers most countries' postal code lengths)
    const pinCodeRegex = /^\d{4,10}$/;
    if (!pinCodeRegex.test(String(pinCode).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid pin code' });
    }

    // 7. phoneNumber — digits only, 10 to 15 characters (same rule as your updateProfile controller)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(String(phoneNumber).trim())) {
      return res.status(400).json({ success: false, message: 'Phone number must contain only digits and be at least 10 digits long' });
    }

    // 8. email — optional field, but if provided, must be valid format
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email' });
      }
    }

    // Check if user already has any address; if none, make this first one default
    const existingCount = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = existingCount === 0 ? true : Boolean(isDefault);

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const newAddress = await Address.create({
      user: req.user._id,
      name: trimmedName,
      addressType: addressType || 'Home',
      detailedAddress: trimmedAddress,
      country: country.trim(),
      city: city.trim(),
      pinCode: String(pinCode).trim(),
      phoneNumber: String(phoneNumber).trim(),
      email,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// PATCH /addresses/:id - Update Address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address Not Found' });
    }

    // If making this one default, unset all others
    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    // Strip forbidden fields
    const { user, _id, ...safeUpdates } = req.body;

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /addresses/:id - Delete Address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address Not Found' });
    }

    // If deleted address was default, set the latest remaining address to default
    if (address.isDefault) {
      const nextDefault = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};