"use strict";
const axios = require("axios");
module.exports = {
	name: "client",
	settings: {
		port: 3000
	},
	async started() {
		// When the query is executed there are 2 separate traces in the console,
		// one for each action the gateway service uses to call the federated graphs
		// I would like these 2 traces to be grouped together in a single span
		// In the ApolloGatewayService mixin there is a middleware that can create a context
		// and pass it on to Apollo Server which will pass it to moleculerGraphQLDataSource,
		// where the calls to the federated services are made
		// the problem is I couldn't find an example of how to create a custom outside the context of an action
		await this.waitForServices("gateway");
		const result = await axios({
			url: "http://localhost:3000/graphql",
			method: "POST",
			data: {
				query: `
				{
					test1
					test2
				}
			`
			}
		});
		this.logger.info(result.data);
	}
};
