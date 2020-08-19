const express = require('express');

const app = express();
const port = 5050;

app.use(express.static('static'));

app.listen(port, () => console.log(`App listening on port ${port}!`));