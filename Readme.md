# Stream large amount of date for the front end

This repo contains an example of:
- A backend service that read a CSV and stream data through an API endpoint using the node streams and node web streams library
- A frontend service that reach an endpoint that serves data using streams and display this data on a simple page.

The goal here is have a simple solution to display large amount of data on-demand in frontend, now this is possible thanks to node web streams. The CSV file used in this repo has something about 4K lines, but the strategy can work with any amount of data (taking care of course to not explode the browser memory trying to display a large quantity of data on display).

## How it works

The backend (`./server/index.js`) read a csv file using the `csvtojson` library, and streams each line processed/transformed to the frontend, then concatenate with an `"\n"` char, that way the client receive an `NDJson` which is easy to handle.

The frontend (`./app/index.js`) has a unique page with 3 buttons:
    <ol>
        <li>Start from beginning</li>
        <li>Stop</li>
        <li>Start from last item</li>
    </ol>

In that way we can emulate an situation that the user want to stream either from the beginning or from the last item processed.

## How to run
For the backend go inside the `server` folder and run (by default will run on PORT 3000):
```
npm install
npm run dev
```

For the frontend go inside the `app` folder and run (by default will run on PORT 8080):
```
npm install
npm run start
```