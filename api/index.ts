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

module.exports = app;