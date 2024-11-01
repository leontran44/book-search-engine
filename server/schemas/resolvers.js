const { Query } = require('mongoose');
const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { getSingleUser } = require('../controllers/user-controller');

const resolvers = {
	Query: {
		me: async (parent, args, context) => {
			console.log(context.user);
			if (context.user) {
				const userData = await User.findOne({ _id: context.user._id })
					.select('-__v -password')
					.populate('savedBooks');

				return userData;
			}

			throw new Error('Not logged in');
		},
	},
	Mutation: {
		createUser: async (parent, { username, email, password }) => {
			const user = await User.create({ username, email, password });

			if (!user) {
				throw new Error('Something is wrong!');
			}

			const token = signToken(user);
			return { token, user };
		},
		login: async (parent, { username, email, password }) => {
			const user = await User.findOne({
				$or: [{ username }, { email }],
			});

			if (!user) {
				throw new Error("Can't find this user");
			}

			const correctPw = await user.isCorrectPassword(password);

			if (!correctPw) {
				throw new Error('Incorrect password!');
			}

			const token = signToken(user);
			return { token, user };
		},
		saveBook: async (parent, { book }, context) => {
			if (!context.user) {
				throw new Error('You must be logged in to save a book');
			}

			try {
				const updatedUser = await User.findOneAndUpdate(
					{ _id: context.user._id },
					{ $addToSet: { savedBooks: book } },
					{ new: true, runValidators: true }
				);
				return updatedUser;
			} catch (err) {
				console.error(err);
				throw new Error('Unable to save book');
			}
		},
		deleteBook: async (parent, { bookId }, context) => {
			if (!context.user) {
				throw new Error('You must be logged in to delete a book');
			}

			const updatedUser = await User.findOneAndUpdate(
				{ _id: context.user._id },
				{ $pull: { savedBooks: { bookId } } },
				{ new: true }
			);

			if (!updatedUser) {
				throw new Error("Couldn't find user with this ID");
			}

			return updatedUser;
		},
	},
};

module.exports = resolvers;
