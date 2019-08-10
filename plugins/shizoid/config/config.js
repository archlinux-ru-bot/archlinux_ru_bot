module.exports = {
	triggers: [
		/шизик/i,
		/арчебот/i
	],
	punctuation: {
		endSentence: '.!?',
		all: '.!?;:,'
	},
	db: {
		dialect: 'postgres',
		username: process.env.SHIZOID_DB_USERNAME,
		password: process.env.SHIZOID_DB_PASSWORD,
		database: process.env.SHIZOID_DB_DBNAME,
		host: process.env.SHIZOID_DB_HOST,
		port: 5432,
		logging: false
	},
	debug: false
};
