var express = require('express')
var router = express.Router()
var quotes = require('../models/quote')
var gifResponses = require('../models/gif-response')

router
	// TODO: DONT ALLOW USER TO GET ALL QUOTES
	// Add methods to sort by age, and totalScore, include pagination
	.get('/', (req, res, next) => {
		quotes.find({})
			.then(quotes => {
				res.send(quotes[0])
			})
			.catch(next)
	})
	.get('/:id', (req, res, next) => {
		quotes.findById(req.params.id)
			.then(quote => {
				res.send(quote)
			})
			.catch(next)
	})
	.get('/:id/next', (req, res, next) => {
		quotes.find({})
			.then(quotes => {
				let quoteIndex = quotes.findIndex(quote => quote._id == req.params.id)
				if (quotes[quoteIndex + 1])
					res.send(quotes[quoteIndex + 1]);
				else
					res.send(418, { success: false, error: "You've reached the end of the quotes" });
			})
			.catch(next);
	})
	.get('/:id/prev', (req, res, next) => {
		quotes.find({})
			.then(quotes => {
				let quoteIndex = quotes.findIndex(quote => quote._id == req.params.id)
				if (quotes[quoteIndex - 1])
					res.send(quotes[quoteIndex - 1]);
				else
					res.send(418, { success: false, error: "You've reached the beginning of the quotes" });
			})
			.catch(next);
	})
	.get('/:id/gifResponses', (req, res, next) => {
		gifResponses.find({ quoteId: req.params.id })
			.then(gifResponses => {
				res.send(gifResponses)
			}).catch(next)
	})
	.post('/', (req, res, next) => {
		req.body.userId = req.session.uid;
		quotes.create(req.body)
			.then(quote => {
				quote.created = Math.floor(Date.now() / 1000);
				res.send(quote)
			}).catch(next)
	})
	.put('/:id/vote', (req, res, next) => {
		let userVote = req.body.vote;
		let userId = req.body.userId;
		quotes.findById(req.params.id)
			.then(quote => {
				updateUserVote(quote, userVote, userId)
				quote.save((err, todo) => {
					res.send(quote);
				});
			}).catch(next)
	})
	.delete('/:id', (req, res, next) => {
		quotes.findById(req.params.id)
			.then(quote => {
				if (req.session.uid.toString() == quote.userId.toString()) {
					quote.remove()
					res.send({ message: 'Successfully Removed' })
				} else {
					res.send({ message: 'You are not authorized to remove this quote' })
				}
			}).catch(next)

		// Below code to empty out database of quotes. DO NOT USE UNLESS YOU KNOW WHAT YOU'RE DOING
		// quotes.find({}).then(quotes => {
		// 	quotes.forEach(quote => quote.remove())
		// })
	})

// ERROR HANDLER
router.use('/', (err, req, res, next) => {
	if (err) {
		res.send(418, {
			success: false,
			error: err.message
		})
	} else {
		res.send(400, {
			success: false,
			error: 'Something failed please try again later'
		})
	}
})

function updateUserVote(quote, userVote, userId) {
	if (userVote) {
		if (quote.votes[userId] == 1) {
			quote.votes[userId] = 0
		} else {
			quote.votes[userId] = 1
		}
	} else {
		if (quote.votes[userId] == -1) {
			quote.votes[userId] = 0
		} else {
			quote.votes[userId] = -1
		}
	}
	getTotalPoints(quote)
}

// Total points for quotes.
function getTotalPoints(quote) {
	var total = 0;
	for (vote in quote.votes) {
		total += quote.votes[vote]
	}
	quote.totalPoints = total
}

module.exports = router
