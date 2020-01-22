"use strict";

const ApolloFederatedService = require("../mixins/Apollo/ApolloFederatedService.mixin");

module.exports = {
	name: "graph2",
	mixins: [
		ApolloFederatedService
	],
	settings: {
		graphql: {
			typeDefs: `
				extend type Query {
					test2: String
				}
			`,
			resolvers: {
				Query: {
					test2: () => "2"
				}
			}
		}
	}
};
