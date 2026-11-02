const userService = require("../services/user.service");

const getProfile = async (req, res) => {
  const user = await userService.getProfile(req.userId);
  res.json({ success: true, message: "Profil berhasil diambil", data: user });
};

module.exports = { getProfile };
