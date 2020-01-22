"use strict";

const {ApolloGateway, GraphQLDataSource, ServiceEndpointDefinition} = require("@apollo/gateway");
const {ApolloServer} = require("apollo-server-express");
const express = require("express");
const {GraphQLRequestContext, GraphQLResponse} = require("graphql-request/dist/src/types");
const axios = require("axios");

const moleculerGraphQLDataSource = function(service) {
	const svc = this;
	const broker = svc.broker;
	return {
		async process(request) {
			const result = await broker.call(`${service.name}.executeQuery`, {
				query: request.request.query,
				variables: request.request.variables
			}, {
				parentSpan: request.context.span
			});
			const response = {
				status: 200,
				data: result.data
			};
			return response;
		}
	};
};

const ApolloGatewayService = {
	name: "ApolloGatewayService",
	settings: {
		gateway: {
			startMaxRetries: 30,
			retryInterval: 1000
		}
	},
	methods: {
		moleculerGraphQLDataSource,
		async getGraphQLGateway(services) {
			const serviceList = services
				.filter((service) => service.metadata.federatedService === true)
				.map((service) => {
					return {
						name: service.name,
						url: `http://localhost:${service.settings.port}${service.metadata.graphqlPath}`
					};
				});
			return new ApolloGateway({
				serviceList,
				buildService: (service) => this.moleculerGraphQLDataSource(service)
			});
		},
		async initServer() {
			const broker = this.broker;
			await this.waitForServices("$node");
			const services = await this.broker.call("$node.services", {
				onlyLocal: true,
				onlyAvailable: true
			});
			const gateway = await this.getGraphQLGateway(services);
			const server = new ApolloServer({
				gateway,
				introspection: true,
				playground: true,
				subscriptions: false,
				plugins: [
					{
						requestDidStart(requestContext) {
							requestContext.context.span = broker.tracer.startSpan("Execute query", { tags: {
								query: requestContext.request.query,
								variables: requestContext.request.variables
							}});
							return {
								willSendResponse(requestContext) {
									console.log("Will send response");
									if (requestContext.context.span)
										requestContext.context.span.finish();
								}
							};
						}
					}
				]
			});
			const app = express();
			app.use((async function(req, res, next) {
				console.log("Before request");
				// Should be possible to create
				next();
			}).bind(this));
			server.applyMiddleware({ app });

			await app.listen(this.settings.port);
			const serverUrl = `http://localhost:${this.settings.port}${server.graphqlPath}`;
			this.logger.info(`🚀 Server ready at ${serverUrl}`);
			// const serverResult = await apolloServer.listen(this.settings.port);
			// this.logger.info(`🚀 Apollo Gateway ready at ${serverResult.url}`);
			return {
				server,
				serverUrl,
				app
			};
		},
		async startServer(tryCounter = 0) {
			try {
				return await this.initServer();
			} catch (e) {
				this.logger.warn("Failed to initialize gateway", e.stack);
				if (tryCounter < this.settings.gateway.startMaxRetries) {
					this.logger.info(`Retrying server start in ${this.settings.gateway.retryInterval}ms`);
					await this.sleep(this.settings.gateway.retryInterval);
					return await this.startServer(tryCounter + 1);
				} else {
					throw new Error(`Failed to start server after ${this.settings.gateway.startMaxRetries} retries`);
				}
			}
		}
	},
	async started() {
		const { server, serverUrl } = await this.startServer();
		this.settings.server = server;
		this.settings.serverUrl = serverUrl;
		this.logger.info("Server started");
		this.broker.emit("gateway.started");
	},
	async stopped() {
		if (this.settings.server) {
			this.logger.info("Shutting down Apollo server gateway");
			await this.settings.server.close();
		}
	}
};

module.exports = ApolloGatewayService;
