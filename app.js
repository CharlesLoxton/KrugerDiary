import { diaryController } from "./Controllers/diaryController.js";
import { Server } from "./Server/Server.js";

//Initialize Fastify App
const app = new Server();

// Declare a default route
app.fastify.get('/health', (req, res) => {
    return res.status(200).send("Success");
});

app.fastify.get('/error', (req, res) => {
    return res.view('Error/404Page');
});

//Register controllers
app.register(diaryController, { prefix: '/'});

app.listen();
