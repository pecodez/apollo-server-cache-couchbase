# apollo-server-cache-couchbase
A Couchbase implementation of Apollo Server KeyValue cache store.

While Memcached and Redis make a preferred solution to a query cache for Apollo Server, if your backend is already using Couchbase, you should make use of a memcached Couchbase bucket rather than throwing more tech on your stack. This is why I wrote *apollo-server-cache-couchbase*.

### ApolloServer
````javascript
const { CouchbaseCache } = require('apollo-server-cache-couchbase');
const { ApolloServer } = require('apollo-server');

const server = new ApolloServer({
    ...
    persistedQueries: {
        cache: new CouchbaseCache(
            {
                host: 'couchbase://localhost',
                bucket: 'gqlcache',
                auth: {
                    username: 'username',
                    password: 'password'
                }
            }
        )
    }
});
````
### ApolloServer with Express
````javascript
const express = require('express');
const { CouchbaseCache } = require('apollo-server-cache-couchbase');
const { ApolloServer } = require('apollo-server-express');

const app = express();

const server = new ApolloServer({
    ...
    persistedQueries: {
        cache: new CouchbaseCache(
            {
                host: 'couchbase://localhost',
                bucket: 'gqlcache',
                auth: {
                    username: 'username',
                    password: 'password'
                }
            }
        )
    }
});

server.applyMiddleware({ app });
````
