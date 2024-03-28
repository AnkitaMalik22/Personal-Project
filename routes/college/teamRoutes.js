const express = require("express");
const router = express.Router();
const { isAuthenticatedCollege } = require("../../middlewares/auth");
const {
    addMember,
    getAllMembers,
    getSingleMember,
    updateMember,
    deleteMember,
} = require("../../controllers/college/teams/teamController");

router.route("/add").post(isAuthenticatedCollege, addMember);
router.route("/").get(isAuthenticatedCollege, getAllMembers);
router.route("/:id").get(isAuthenticatedCollege, getSingleMember);
router.route("/:id/update").put(isAuthenticatedCollege, updateMember);
router.route("/:id/delete").delete(isAuthenticatedCollege, deleteMember);

module.exports = router;