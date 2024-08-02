import express from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
// import { typeDefs, resolvers } from './schema';


const TODOS = [
    { id: '1', title: 'Buy groceries', completed: false, userId: '1' },
    { id: '2', title: 'Walk the dog', completed: true, userId: '2' },
    { id: '3', title: 'Read a book', completed: false, userId: '2' },
]

const USERS = [
    { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' },
    { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' },
]

const init = async () => {
    interface MyContext {
        token?: string;
    }

    const app = express();
    const httpServer = http.createServer(app);

    // GraphQL server
    const server = new ApolloServer<MyContext>({
        typeDefs: `
           type User {
                id:ID!
                name: String!
                age: Int!
                email: String!
                todos: [Todo!]!
            }
            type Todo {
                id:ID!
                title: String!
                completed: Boolean!
                user: User!
            }
         


            type Query {
                getUser(id: ID!): User
                getUsers: [User!]!
                getTodo(id: ID!): Todo
                getTodos: [Todo!]!
            }

       
        `,
        resolvers: {
            Query: {
                getUser: (parent, { id }) => {
                    return USERS.find((user) => user.id === id)
                },
                getUsers: () => {
                    return USERS
                },
                getTodo: (parent, { id }) => {
                    return TODOS.find((todo) => todo.id === id)
                },
                getTodos: () => {
                    return TODOS
                },
            },
            // Mutation: {
            //     createUser: (parent, args) => {
            //         const newUser = { id: `${USERS.length + 1}`, ...args };
            //         USERS.push(newUser);
            //         return newUser;
            //     },
            //     createTodo: (parent, args) => {
            //         const newTodo = { id: `${TODOS.length + 1}`, ...args, completed: false };
            //         TODOS.push(newTodo);
            //         return newTodo;
            //     },
            // },
            User: {
                todos: (parent) => TODOS.filter(todo => todo.userId === parent.id),
            },
            Todo: {
                user: (parent) => USERS.find(user => user.id === parent.userId),
            },
        },
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })], // We tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.
    });

    // Ensure we wait for our server to start
    await server.start();

    //   MiddleWare
    // app.use(cors<cors.CorsRequest>())
    // app.use(express.json())

    // Route
    app.get("/", (req, res) => {
        res.json({
            message: "Server is up and running."
        })
    })

    app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => ({ token: req.headers.token }),
        }),
    );

    // Modified server startup
    httpServer.listen({ port: 8000 }, () => {
        console.log(`🚀 Server ready at http://localhost:8000/`);
    })

}

init()