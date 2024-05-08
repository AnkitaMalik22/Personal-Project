const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema({

userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    // required: true
},
paymentDate : {
    type: Date,
    // required: true
},
description : {
    type: String,
    // required: true
},
planDuration : {
    type: String,
    // required: true
},
mode : {
    type: String,
    // required: true
},
status : {
    type: String,
    // required: true
},
amount : {
    type: Number,
    // required: true
},
subscription : {
    type: String,
    // required: true
},
enrollmentDate : {
    type: Date,
    // required: true
},
transactionID : {
    type: String,
    // required: true
},
paymentMethod : {
    type: String,
    // required: true
},
products : {
    type: Array,
    // required: true
},
invoice : {
//type:Array,
    // required: true

},
cardDetails : {
},




}, {
    timestamps: true});


const Payment = mongoose.model('Subscription', paymentSchema);

module.exports = Payment;