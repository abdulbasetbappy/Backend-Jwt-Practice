const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username:{
        type: 'string',
        required: true,
        unique: true,
    },
    password:{
        type: 'string',
        required: true,
    },
    createdOn:{
        type: Date,
        default: Date.now,
    },
})

const User = mongoose.model('User', userSchema);
module.exports = User;