const { Router } = require("express");
const validate = require("../middlewares/validate");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
