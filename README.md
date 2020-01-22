[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# moleculer-apollo-federation-example

- gateway.service.js - the Apollo gateway service
- graph1.service.js and graph2.service.js - federated graphql schmeas, each one returns a single field (test1 of test 2)
- client.service.js - on startup calls the gateway service and asks for both test1 and test2 fields in a single query 

When the query is executed there are 2 separate traces in the console for graph1.executeQuery and graph2.executeQuery,
one for each action the gateway service uses to call the federated graphs
I would like these 2 traces to be grouped together in a single span

In the ApolloGatewayService mixin there is a middleware that can create a context
and pass it on to Apollo Server which will pass it to moleculerGraphQLDataSource where the calls to the federated services are made
the problem is I couldn't find an example of how to create a custom outside the context of an action

## NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
