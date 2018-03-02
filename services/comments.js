const CommentModel = require('../models/comment');

const debug = require('debug')('talk:services:comments');
const SettingsService = require('./settings');

const cloneDeep = require('lodash/cloneDeep');
const errors = require('../errors');
const merge = require('lodash/merge');
<<<<<<< HEAD
const { dotize } = require('./utils');
const { COMMENTS_NEW, COMMENTS_EDIT } = require('./events/constants');
=======
>>>>>>> 8d147dbf47104cdcfb8c3bc2ebb02b6c73c7b8ab

const incrReplyCount = async (comment, value) => {
  try {
    await CommentModel.update(
      {
        id: comment.parent_id,
      },
      {
        $inc: {
          reply_count: value,
        },
      }
    );
  } catch (err) {
    console.error("Can't mutate the reply count:", err);
  }
};

module.exports = {
  /**
   * Creates a new Comment that came from a public source.
   * @param  {Object} input either a single comment or an array of comments.
   * @return {Promise}
   */
  publicCreate: async input => {
    // Extract the parent_id from the comment, if there is one.
    const { status = 'NONE', parent_id = null } = input;
    const created_at = new Date();

    // Check to see if we are replying to a comment, and if that comment is
    // visible.
    if (parent_id !== null) {
      const parent = await CommentModel.findOne({ id: parent_id });
      if (parent === null || !parent.visible) {
        throw errors.ErrParentDoesNotVisible;
      }
    }

    // Create the comment in the database.
    const comment = await CommentModel.create(
      merge(
        {
          status_history: status
            ? [
                {
                  type: status,
                  created_at,
                },
              ]
            : [],
          body_history: [
            {
              body: input.body,
              created_at,
            },
          ],
        },
        input
      )
    );

    // Emit that the comment was created!
    await incrReplyCount(comment, 1);

    return comment;
  },

  /**
   * Edit a Comment.
   *
   * @param {String} id         comment.id you want to edit (or its ID)
   * @param {String} author_id  user.id of the user trying to edit the comment (will err if not comment author)
   * @param {String} body       the new Comment body
   * @param {String} status     the new Comment status
   */
<<<<<<< HEAD
  static async edit({ id, author_id, body, status, metadata = {} }) {
=======
  edit: async ({ id, author_id, body, status }) => {
>>>>>>> 8d147dbf47104cdcfb8c3bc2ebb02b6c73c7b8ab
    const EDITABLE_STATUSES = ['NONE', 'PREMOD', 'ACCEPTED'];
    const created_at = new Date();

    const query = {
      id,
      author_id,
      status: {
        $in: EDITABLE_STATUSES,
      },
    };

    // Establish the edit window (if it exists) and add the condition to the
    // original query.
    const {
      editCommentWindowLength: editWindowMs,
    } = await SettingsService.retrieve();
    const lastEditableCommentCreatedAt = new Date(Date.now() - editWindowMs);
    query.created_at = {
      $gt: lastEditableCommentCreatedAt,
    };

    const originalComment = await CommentModel.findOneAndUpdate(query, {
      $set: dotize({
        body,
        status,
        metadata,
      }),
      $push: {
        body_history: {
          body,
          created_at,
        },
        status_history: {
          type: status,
          created_at,
        },
      },
    });

    if (originalComment == null) {
      // Try to get the comment.
      const comment = await CommentModel.findOne({ id });
      if (comment == null) {
        debug('rejecting comment edit because comment was not found');
        throw errors.ErrNotFound;
      }

      // Check to see if the user was't allowed to edit it.
      if (comment.author_id !== author_id) {
        debug(
          'rejecting comment edit because author id does not match editing user'
        );
        throw errors.ErrNotAuthorized;
      }

      // Check to see if the comment had a status that was editable.
      if (!EDITABLE_STATUSES.includes(comment.status)) {
        debug(
          'rejecting comment edit because original comment has a non-editable status'
        );
        throw errors.ErrNotAuthorized;
      }

      // Check to see if the edit window expired.
      if (comment.created_at <= lastEditableCommentCreatedAt) {
        debug('rejecting comment edit because outside edit time window');
        throw errors.ErrEditWindowHasEnded;
      }

      throw new Error('comment edit failed for an unexpected reason');
    }

    // Mutate the comment like Mongo would have.
    const editedComment = cloneDeep(originalComment);
    editedComment.status = status;
    editedComment.body = body;
    editedComment.body_history.push({
      body,
      created_at,
    });

    editedComment.status_history.push({
      type: status,
      created_at,
    });

<<<<<<< HEAD
    editedComment.metadata = metadata;

    await events.emitAsync(COMMENTS_EDIT, originalComment, editedComment);

=======
>>>>>>> 8d147dbf47104cdcfb8c3bc2ebb02b6c73c7b8ab
    return editedComment;
  },

  /**
   * Pushes a new status in for the user.
   * @param {String} id          identifier of the comment  (uuid)
   * @param {String} status      the new status of the comment
   * @param {String} assigned_by the user id for the user who performed the
   *                             moderation action
   * @return {Promise}
   */
  pushStatus: async (id, status, assigned_by = null) => {
    const created_at = new Date();
    const originalComment = await CommentModel.findOneAndUpdate(
      { id },
      {
        $push: {
          status_history: {
            type: status,
            created_at,
            assigned_by,
          },
        },
        $set: { status },
      }
    );

    if (originalComment == null) {
      throw errors.ErrNotFound;
    }

    const editedComment = new CommentModel(originalComment.toObject());
    editedComment.status_history.push({
      type: status,
      created_at,
      assigned_by,
    });
    editedComment.status = status;

    // If the comment was visible before, and now it isn't, decrement the count;
    if (originalComment.visible && !editedComment.visible) {
      await incrReplyCount(editedComment, -1);
    }

    // If the comment was not visible before, and now it is, increment the count.
    if (!originalComment.visible && editedComment.visible) {
      await incrReplyCount(editedComment, 1);
    }

    return editedComment;
  },
};
