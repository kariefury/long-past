const fs = require('fs');
const xml2js = require('xml2js');
const he = require('he');

const xmlFilePath = 'carriesblog.WordPress.2023-12-27.xml';
const outputDirectory = 'docs';
const faviconPath = 'favicon.ico'; // Update with the correct path to your favicon file

// Create output directory
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}

let counter = 1;
const toc = []; // Table of contents array

// Read the contents of style.css and background.svg
const cssContent = fs.readFileSync('style.css', 'utf-8');
const svgBackground = fs.readFileSync('background.svg', 'utf-8');
const faviconContent = fs.readFileSync(faviconPath);

fs.readFile(xmlFilePath, 'utf-8', (err, data) => {
    if (err) {
        console.error('Error reading XML file:', err);
        return;
    }

    const parser = new xml2js.Parser({ explicitArray: false });

    parser.parseString(data, (parseErr, result) => {
        if (parseErr) {
            console.error('Error parsing XML:', parseErr);
            return;
        }

        const items = result.rss.channel.item;

        items.forEach(item => {
            const title = he.decode(item.title);

            // Exclude the post titled "Custom styles"
        if (title.toLowerCase() === 'custom styles') {
            return;
        }

            const content = he.decode(item['content:encoded']);
            const pubDate = new Date(item.pubDate);

            // Create an HTML file with the counting string and date in the filename
            const fileName = `${outputDirectory}/post_${counter}_${pubDate.toDateString()}.html`;
            fs.writeFileSync(fileName, `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${title}</title>
                    <link rel="icon" href="data:image/x-icon;base64,${faviconContent.toString('base64')}" type="image/x-icon" />
                    <style>
                        ${cssContent}
                        body {
                            background: url("data:image/svg+xml;utf8,${encodeURIComponent(svgBackground)}") repeat;
                        }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p>Published on: ${pubDate.toDateString()}</p>
                    ${content}
                </body>
                </html>
            `, 'utf-8');

            // Extract a 25-word snippet only if content is over 25 words
            const words = content.split(' ');
            const snippet = words.length > 25 ? words.slice(0, 25).join(' ') : '';

            // Add entry to the table of contents with snippet
            toc.push(`<li><a href="docs/${fileName}">${title} - ${pubDate.toDateString()}${snippet ? `<br>${snippet}` : ''}</a></li>`);

            counter++;
        });

        // Reverse the order of the table of contents
        toc.reverse();

        // Create the index.html file with the reversed table of contents and background
        const indexContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Archive of the blog of Carrie Segal</title>
                <link rel="icon" href="data:image/x-icon;base64,${faviconContent.toString('base64')}" type="image/x-icon" />
                <style>
                    ${cssContent}
                    body {
                        background: url("data:image/svg+xml;utf8,${encodeURIComponent(svgBackground)}") repeat;
                    }
                </style>
            </head>
            <body>
                <h1>Archive of the blog of Carrie Segal</h1>
                <ul id="toc">
                    ${toc.join('\n')}
                </ul>
            </body>
            </html>
        `;

        fs.writeFileSync(`${outputDirectory}/index.html`, indexContent, 'utf-8');

        console.log('Conversion complete. HTML files and index.html saved in the "output" directory.');
    });
});
