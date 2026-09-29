const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must have an author'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index: supports the $lookup in Scenario 2, which resolves posts by
// foreignField 'author' and then sorts by _id desc inside the inner pipeline.
postSchema.index({ author: 1, _id: -1 });

// Hide the mongoose version key from API responses
postSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Post', postSchema);