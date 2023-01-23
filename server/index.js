import csvtojson from 'csvtojson';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { Readable, Transform } from 'node:stream'; // Fonte dos dados
import { TransformStream, WritableStream } from 'node:stream/web'; // Saida dos dados
import { setTimeout } from 'node:timers/promises';
import { parse } from 'node:url';

const PORT = 3000
const FILENAME = './animeflv.csv'

createServer(async(request, response) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
    }

    if (request.method === "OPTIONS") {
        response.writeHead(204, headers)
        response.end()
        return
    }

    const { start } = parse(request.url, true).query

    let items = 0
    request.once('close', _ => console.log(`items processed: ${items}`))
    Readable.toWeb(createReadStream(FILENAME))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(new TransformStream({
        transform(chunk, controller) {
            console.log
            if (!start || items > parseInt(start)) {
                const data = JSON.parse(Buffer.from(chunk))
                const mappedData = {
                    title: data.title,
                    description: data.description,
                    url: data.url_anime
                }
                controller.enqueue(JSON.stringify(mappedData).concat('\n'))
            } else {
                controller.enqueue('')
            }
        },
    }))
    .pipeTo(new WritableStream({
        async write(chunk) {
            await setTimeout(1000)
            items++
            response.write(chunk)
        },
        close() {
            response.end()
        }
    }))
    
    response.writeHead(200, headers)
})
.listen(PORT)
.on('listening', _ => console.log(`server running on port ${PORT}`))
