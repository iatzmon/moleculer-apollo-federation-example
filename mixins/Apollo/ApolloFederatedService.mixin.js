const {buildFederatedSchema} = require("@apollo/federation");
const {gql} = require("apollo-server-express");
const { graphql} = require("graphql");
const Moleculer = require("moleculer");
const MoleculerServerError = Moleculer.Errors.MoleculerServerError;

const ApolloFederatedService = {
	name: "ApolloFederatedService",
	metadata: {
		federatedService: true,
		graphqlPath: "/graphql"
	},
	methods: {
		generateGraphQLSchema() {
			try {
				const { typeDefs, resolvers } = this.settings.graphql;
				return buildFederatedSchema([{
					typeDefs: gql(typeDefs),
					resolvers
				}]);
			} catch (err) {
				throw new MoleculerServerError(
					"Unable to compile GraphQL schema",
					500,
					"UNABLE_COMPILE_GRAPHQL_SCHEMA",
					{ err },
				);
			}
		}
	},
	actions: {
		async executeQuery(ctx) {
			const { query, variables} = ctx.params;
			const context = {
				ctx,
				service: this
			};
			const result = await graphql(this.schema, query, undefined, context, variables);
			return result;
		}
	},
	async started() {
		this.schema = this.generateGraphQLSchema();
	},
};

module.exports = ApolloFederatedService;
