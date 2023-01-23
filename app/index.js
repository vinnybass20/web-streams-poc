const API_URL = 'http://localhost:3000'
let lastItem = localStorage.getItem('lastItem')
let counter = lastItem ? JSON.parse(lastItem).index : 0

async function consumeAPI(signal, fromBeginning) {
    let url = API_URL
    if (lastItem && !fromBeginning) {
        const index = JSON.parse(lastItem).index
        url += `?start=${index}`
    }
    const response = await fetch(url, {
        signal
    })

    const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(parseNdJSON())
    
    return reader
}

function saveItemLocally(item) {
    localStorage.setItem('lastItem', item)
}

// if in the same stream n >1 chunks came, we convert correctly the ndJson to have n new json objects
function parseNdJSON() {
    let ndjsonBuffer = ''
    return new TransformStream({
        transform(chunk, controller) {
            ndjsonBuffer += chunk
            const items = ndjsonBuffer.split('\n')
            items.slice(0,-1)
                .forEach(item => {
                    counter++
                    controller.enqueue(JSON.parse(item))
                    lastItem = JSON.stringify({ index: counter, item })
                })
            
            ndjsonBuffer = items[items.length - 1]
        },
        flush(controller) { // after finish transform
            if(!ndjsonBuffer) return
            controller.enqueue(JSON.parse(ndjsonBuffer))
        }
    })
}

function addCardToElement(index, cardItem, element) {
    const { title, description, url } = cardItem
    const card = `            
        <article>
            <div class="text">
                <h3>[${index}] ${title}</h3>
                <p>${description.slice(0,100)}</p>
                <a href="${url}">See information</a>
            </div>
        </article>
    `
    element.innerHTML += card
}

function cleanCards(element) {
    element.innerHTML = ''
}

function appendToHTML(element) {
    return new WritableStream({
        write(chunk) {
            addCardToElement(counter, chunk, element)
        },
        abort(reason) {
            saveItemLocally(lastItem)
            console.log('aborted')
        }
    })
}

const [
    start,
    stop,
    cards,
    startFromLast
] = ['start', 'stop', 'cards', 'startFromLast'].map(elementId => document.getElementById(elementId))


if (lastItem) {
    startFromLast.hidden = false
    const cardItem = JSON.parse(lastItem)
    addCardToElement(cardItem.index, JSON.parse(cardItem.item), cards)
} else {
    startFromLast.hidden = true
}

let abortController = new AbortController()
start.addEventListener('click', async () => {
    start.disabled = true
    startFromLast.disabled = true

    if (lastItem) {
        counter = 0
        cleanCards(cards)
    }
    try {
        const readable = await consumeAPI(abortController.signal, true)
        await readable.pipeTo(appendToHTML(cards), { signal: abortController.signal })
    } catch (err) {
        if (!err.message.includes('abort')) throw err
        start.disabled = false
        startFromLast.disabled = false
    }
})

startFromLast.addEventListener('click', async () => {
    start.disabled = true
    startFromLast.disabled = true
    try {
        const readable = await consumeAPI(abortController.signal, false)
        await readable.pipeTo(appendToHTML(cards), { signal: abortController.signal })
    } catch (err) {
        if (!err.message.includes('abort')) throw err
        start.disabled = false
        startFromLast.disabled = false
    }
})

stop.addEventListener('click', () => {
    abortController.abort()
    console.log('aborting...')
    abortController = new AbortController()
})


// Todo
// Remove logic from start from last to global var
// organize the code