import { createYoga, createSchema, maskError } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { createContext, GraphQLContext } from '@/lib/graphql/context';

const yoga = createYoga<GraphQLContext>({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response, Request },
  context: async ({ request }) => createContext(request),
  maskedErrors: {
    maskError(error: unknown, message: string) {
      if (error instanceof GraphQLError) {
        return error;
      }
      if (error instanceof Error) {
        // Return clear, safe validation or authentication messages
        return new GraphQLError(error.message);
      }
      return maskError(error, message);
    },
  },
});

export async function GET(request: Request) {
  const ctx = await createContext(request);
  return yoga.handleRequest(request, ctx);
}

export async function POST(request: Request) {
  const ctx = await createContext(request);
  return yoga.handleRequest(request, ctx);
}
