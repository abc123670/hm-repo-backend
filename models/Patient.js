const mongoose =require('mongoose')

const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    date: {
        type: Date,
        default: Date.now,
    },
})

const PatientModel = mongoose.model("Patient", PatientSchema)
module.exports = PatientModel