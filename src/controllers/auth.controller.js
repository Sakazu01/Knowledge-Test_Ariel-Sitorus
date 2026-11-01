const authService = require("../services/auth.service");

const register = async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, message: "Registrasi berhasil", data: user });
};

module.exports = { register };
