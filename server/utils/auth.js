const jwt = require('jsonwebtoken');

// set token secret and expiration date
const secret = 'mysecretsshhhhh';
const expiration = '2h';

module.exports = {
	// Middleware function for authenticating GraphQL requests
	authMiddleware: function ({ req }) {
		// allows token to be sent via  req.query or headers
		let token = req.query.token || req.headers.authorization;

		// ["Bearer", "<tokenvalue>"]
		// Extract token if it was sent as a Bearer token
		if (req.headers.authorization) {
			token = token.split(' ').pop().trim();
		}

		if (!token) {
			return req; // return request object so resolvers can execute
		}

		// verify token and get user data out of it
		try {
			const { data } = jwt.verify(token, secret, { maxAge: expiration });
			req.user = data;
		} catch {
			console.log('Invalid token');
		}

		// Return the request object so resolvers can execute
		return req;
	},
	signToken: function ({ username, email, _id }) {
		const payload = { username, email, _id };

		return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
	},
};
