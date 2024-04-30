import Fastify from 'fastify';
import path from 'path';
import formBody from '@fastify/formbody';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import FastifyCors from '@fastify/cors';
import session from '@fastify/secure-session';
import flash from "@fastify/flash";
import multer from 'fastify-multer';
import ejs from 'ejs';
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
//import { getFlash } from "../Functions/Notifications/getFlash.js";
import qs from 'qs';
dotenv.config();

export class Server {

    constructor() {

        this.fastify = Fastify({ logger: false });

        this.fastify.register(formBody, { parser: str => qs.parse(str) });
        this.fastify.register(multer.contentParser);

        // Setup file uploads
        const storage = multer.memoryStorage();
        const upload = multer({ 
            storage: storage, 
            limits: { fileSize: 10 * 1024 * 1024 } //10MB
        });

        // Decorate the Fastify instance
        this.fastify.decorate('upload', upload);

        this.fastify.register(FastifyCors, {
            // Set the allowed origin or use '*' for allowing any origin
            origin: process.env.DOMAIN // replace with your client's URL
        });

        // Register cookie and JWT plugins
        this.fastify.register(fastifyCookie, { secret: process.env.TOKEN_SECRET});

        this.fastify.register(fastifyJwt, { 
            secret: process.env.TOKEN_SECRET, 
            cookie: {
                cookieName: 'kruger_jwt',
                signed: false
             } 
        });

        // Register view engine for EJS
        this.fastify.register(fastifyView, {
            engine: {
                ejs: ejs
            },
            root: path.join(path.dirname(fileURLToPath(import.meta.url)), "../Views"),
            viewExt: 'ejs',
            includeViewExtension: true
        });
  
        // Register static files
        this.fastify.register(fastifyStatic, {
            root: path.join(path.dirname(fileURLToPath(import.meta.url)), '../Public'),
            prefix: '/',
        });

        this.fastify.register(session, {
            // the name of the session cookie, defaults to 'session'
            cookieName: 'KrugerSession',
            key: Buffer.from(process.env.TOKEN_SECRET, 'hex'),
            cookie: {
              path: '/',
            }
        });

        this.fastify.register(flash);

        this.fastify.setErrorHandler(async (error, request, reply) => {
            try{
                console.log(error);
                await reply.redirect('/error');
            }
            catch(err){
                reply.status(500).send('Internal Server Error');
            }
        })

        this.fastify.setNotFoundHandler(function (request, reply) {
           reply.view("Error/404Page", {Message: 'This page does not exist.'});
        });
        
        this.fastify.decorateRequest('status', null);

        // JWT Authentication Hook
        this.fastify.decorate('authenticate', (role = null) => {

            return async (request, reply) => {
                try {
                    // JWT Authentication
                    const token = request.cookies?.lr_jwt;
                    
                    if (!token) {
                        return reply.redirect("/auth/login");
                    }
                    
                    await request.jwtVerify({onlyCookie: true});

                    if(role){
                        if(!request.user[role]){
                            throw new Error('Unauthorized to view this page.')
                        }
                    }
                    
                    //request.status = getFlash(reply);
    
                    // If the user has permission, the function will naturally proceed to the handler
        
                } catch (error) {
                    return reply.redirect('/auth/login');
                }
            };
        });

    }

    register(handler, options = {}){
        this.fastify.register(handler, options);
    }

    async listen() {
        try {
            console.log(`listening on ${process.env.PORT}`);
            await this.fastify.listen({ port: process.env.PORT || 8080, host: '0.0.0.0' })
            this.fastify.log.info(`server listening on ${this.fastify.server.address().port}`);
        } catch (err) {
            this.fastify.log.error(err);
            process.exit(1);
        }
    }
}
