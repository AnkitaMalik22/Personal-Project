const mongoose = require("mongoose");   

const teamSchema = new mongoose.Schema({

    Name: {
        type: String,
        required: [true, 'Please Enter Your Name'],
        unique: true,
    },
    Role: {
        type: String,
        default: "team",
    },
    Avatar: {
        public_id: {
            type: String,
            // required:true
        },
        url: {
            type: String,
            // required:true
        },
    },
    Email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
    },
    Password: {
        type: String,
        // required: [true, 'Please Enter Your Password'],
        // minLength: [8, "Password should be greater than 8 characters"],
        // select: false,
    },
    Phone: Number,
    College: {
        type: mongoose.Schema.ObjectId,
        ref: 'College',
        required: true,
    },

});

const Teams = mongoose.model('Teams', teamSchema);
module.exports = Teams;


  
