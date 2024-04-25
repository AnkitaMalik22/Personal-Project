const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({

    planName : {
        type:String,
    },
    price:{
        type :String,
    },
    limit :{
        type : Number,
        default : 0,
    },
    credit : {
        type : Number,
        default : 0,
    },
    charges:{
        type :String,
    },
    limit : {
        type : Number,
        default : 0,
    },
    college : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
    },
    expiresAt : {
        type : Date,
        default : Date.now()
    },
    active : {
        type : Boolean,
        default : false
    }

},{timestamps: true})


const Credit = mongoose.model('Credit', creditSchema);

module.exports = Credit;