const User = require('../models/user')
const testQuery = async () => {
  const result = await User.find({ isBlocked: false });
  console.log(result);
};

testQuery();