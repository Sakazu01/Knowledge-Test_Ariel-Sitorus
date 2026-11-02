const authService = require("../services/auth.service");

const register = async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, message: "Registrasi berhasil", data: user });
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, message: "Login berhasil", data: result });
};

module.exports = { register, login };
