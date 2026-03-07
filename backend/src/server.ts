import express from 'express';

const app = express();

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen( 3000, '0.0.0.0', () => {
    console.log(`App listening on port ${port}`);
});
