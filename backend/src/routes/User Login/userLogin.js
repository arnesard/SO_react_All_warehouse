const express = require("express");
const {
  loginUser,
  getAllUsers,
  createUser,
  deleteUser,
} = require("../../controllers/User Login/userLoginController");

const router = express.Router();

router.post("/login", loginUser);
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
