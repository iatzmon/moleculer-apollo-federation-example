"use strict";

const ApolloFederatedService = require("../mixins/Apollo/ApolloFederatedService.mixin");

module.exports = {
	name: "graph1",
	mixins: [
		ApolloFederatedService
	],
	settings: {
		graphql: {
			typeDefs: `
				extend type Query {
					test1: String
				}
			`,
			resolvers: {
				Query: {
					test1: () => "1"
				}
			}
		}
	}
};
