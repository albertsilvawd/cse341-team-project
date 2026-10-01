// src/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import pkg from '../package.json' with { type: 'json' };

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kizuna Rail API',
            version: pkg.version,
            description: 'API documentation for the Kizuna Rail train booking platform.'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local development server'
            }
        ]
    },
    // Files containing the @swagger JSDoc comments that document each route.
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;