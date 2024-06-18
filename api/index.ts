const fetchies = require('node-fetch');
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("owolewd"));

async function getBase64(base64: string) {
    // Remove file extension if present
    base64 = base64.replace(/\.[0-9a-z]+$/i, '');

    if (base64.startsWith("http")) {
        return await fetchies(base64).then(res => res.text());
    }
    return base64;
}

app.get('/imagebase64/:base64', async function (req, res) {
    let base64Image = await getBase64(decodeURIComponent(req.params.base64));
    const mimeMatch = base64Image.match(/^data:(.*?);base64,/);
    let mimeType: string;

    if (!mimeMatch) {
        mimeType = 'image/png';
    } else {
        mimeType = mimeMatch[1];
        const base64Prefix = `data:${mimeType};base64,`;

        if (base64Image.startsWith(base64Prefix)) {
            base64Image = base64Image.slice(base64Prefix.length);
        }
    }

    const imageBuffer = Buffer.from(base64Image, 'base64');

    res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': imageBuffer.length,
        'Content-Disposition': `attachment; filename="image.${mimeType.split('/')[1]}"`
    });
    res.end(imageBuffer);
});

app.get("/imgur/:data", async function (req, res) {
    const imgurResponse = await fetchies('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: decodeURIComponent(req.params.data)
        })
    });
    res.send((await imgurResponse.json()).data.link);
});

app.post("/imgur", async function (req, res) {
    console.log(req)
    let base64Image = JSON.parse(req.text).image;
    const imgurClientID = process.env.IMGUR_CLIENT_ID;
    const mimeMatch = base64Image.match(/^data:(.*?);base64,/);

    if (mimeMatch) {
        const base64Prefix = `data:${mimeMatch[1]};base64,`;
        if (base64Image.startsWith(base64Prefix)) {
            base64Image = base64Image.slice(base64Prefix.length);
        }
    }

    const imgurResponse = await fetchies('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            'Authorization': `Client-ID ${imgurClientID}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: base64Image
        })
    });
    const imgurJson = await imgurResponse.json();

    if (imgurResponse.ok) {
        res.send(imgurJson.data.link);
    } else {
        res.status(imgurResponse.status).send(imgurJson);
    }
});

module.exports = app;