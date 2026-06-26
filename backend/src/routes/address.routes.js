const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");
const { 
  getAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress 
} = require("../controllers/address.controller");

const router = express.Router();

router.use(verifyToken);

router.route("/")
  .get(getAddresses)
  .post(addAddress);

router.route("/:id")
  .put(updateAddress)
  .delete(deleteAddress);

module.exports = router;
