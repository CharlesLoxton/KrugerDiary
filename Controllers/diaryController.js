
export const diaryController = (fastify, options, done) => {

    fastify.get('/', async (req, res) => {
        return res.view('Diary/Home');
    });

    fastify.get('/create', async (req, res) => {
        return res.view('Diary/Create');
    });

    fastify.get('/day/:date', async (req, res) => {
        return res.view('Diary/Summary', {date: req.params.date});
    });

    done();
}