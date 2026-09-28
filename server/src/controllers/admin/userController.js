// controllers/adminController.js
const User = require('../../models/user');

const getUsers = async (req, res) => {
  try {
    const { status, search, page = 1 } = req.query;
    const limit = 10;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const filter = {};

    // status filter: active | blocked
    if (status === 'active') filter.isBlocked = false;
    if (status === 'blocked') filter.isBlocked = true;

    filter.isVerified = true;
    // search by name or email (case-insensitive)
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ username: regex }, { email: regex }];
    }

    const totalResults = await User.countDocuments(filter);
  
    const totalPages = Math.ceil(totalResults / limit) || 1;
   

    const users = await User.find(filter)
      .select('username email createdAt isBlocked') // adjust field names to your schema
      .sort({ username:  1 })
      .collation({locale : "en",strength : 1})
      .skip((pageNum - 1) * limit)
      .limit(limit);

    const formatted = users.map(u => ({
      id: u._id,
      username: u.username,
      email: u.email,
      joinedOn: u.createdAt,
      isBlocked: u.isBlocked,
    }));
  

    return res.status(200).json(
       {
        users: formatted,
        totalCustomers: totalResults,
        page: pageNum,
        limit,
        totalResults,
        totalPages,
        },
      
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
  }
};


const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
   
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'No user exists with this id.' },
      });
    }

    const isBlocked = !existingUser.isBlocked;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked },
      { new: true }
    ).select('isBlocked');

    return res.status(200).json(
       { id: user._id, isBlocked: user.isBlocked },
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
  }
};

module.exports = {getUsers, toggleUserStatus } 