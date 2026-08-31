// server/models/entrySchema.js
// Travel Journal entries
const mongoose = require('mongoose');

/*
const photoSchema = new mongoose.Schema({
    url: { 
         type: String, 
         required: true 
     },
    publicId: { 
         type: String, 
         required: true 
      }, // Cloudinary ID
    caption: { 
         type: String, 
         maxlength: 200, 
         default: '' 
        },
});*/

// Define new entrySchema
const entrySchema = new mongoose.Schema(
    {
        //Field for trip
        trip: {
          type: String,
          required: [true, 'Trip is required']  
        },
        //Field for tripId
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            required: true,
        },
        // Field for userId
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Field for user username
        username: {
            type: String,
            required: [true, 'Username is required'],
        },
        //Field for trip title
        title: {
            type: String,
            required: [true, 'Entry title is required'],
            trim: true,
            maxlength: 150,
        },
        //Field for entry body(details)
        body: {
            type: String,         // Stores rich text HTML from TipTap/Quill
            required: true,
            maxlength: 2000,
        },
        //Field for entry date
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        /* ADD Later
        photos: {
            type: [photoSchema],
            validate: {
                validator: (arr) => arr.length <= 20,
                message: 'Maximum 20 photos per entry',
            },
        },*/      
    },
    { timestamps: true }
);

// Text index for full-text search across title, body, tags
entrySchema.index({ title: 'text', body: 'text', tags: 'text' });
entrySchema.index({ tripId: 1, date: -1 });

// Auto-increment entryCount on Trip when an entry is created
entrySchema.post('save', async function () {
    await mongoose.model('Trip').findByIdAndUpdate(this.tripId, {
        $inc: { entryCount: 1 },
    });
});

// Auto-decrement entryCount on Trip when an entry is deleted
entrySchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await mongoose.model('Trip').findByIdAndUpdate(doc.tripId, {
            $inc: { entryCount: -1 },
        });
    }
});
//=============EXPORT MODEL==================
//Export entrySchema to be used in other parts of the application
module.exports = mongoose.model('Entry', entrySchema);