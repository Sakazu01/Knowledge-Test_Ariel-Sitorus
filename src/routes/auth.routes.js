const { Router } = require("express");
const validate = require("../middlewares/validate");
const { registerSchema } = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

const router = Router();

router.post("/register", validate(registerSchema), authController.register);

module.exports = router;
