const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must have an owner'],
    },
  },
  {
    timestamps: true,
  }
);

// Index: supports user's paginated own-notes list (filter by owner, sort by _id desc).
// The admin "list all notes" view needs no extra index - the default _id index
// already serves an unfiltered sort on _id desc.
noteSchema.index({ owner: 1, _id: -1 });

// Hide the mongoose version key from API responses
noteSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Note', noteSchema);