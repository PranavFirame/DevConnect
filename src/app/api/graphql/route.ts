import { createYoga, createSchema } from 'graphql-yoga';
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
});

export async function GET(request: Request) {
  const ctx = await createContext(request);
  return yoga.handleRequest(request, ctx);
}

export async function POST(request: Request) {
  const ctx = await createContext(request);
  return yoga.handleRequest(request, ctx);
}
