"use strict";
const ApolloGatewayService = require("../mixins/Apollo/ApolloGatewayService.mixin");

module.exports = {
	name: "gateway",
	settings: {
		port: 3000
	},
	mixins: [
		ApolloGatewayService
	]
};
