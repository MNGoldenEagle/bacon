import { OptionValues, program } from "commander";
import axios from "axios";
import * as cheerio from "cheerio";

import * as pkg from './package.json';

const WIKI_URL_PREFIX: string = 'https://en.wikipedia.org/wiki/';
const WIKI_RELATIVE_PREFIX: string = '/wiki/';
const TARGET_TOPIC: string = 'Kevin_Bacon';
const EXPLORED_TOPICS: Set<string> = new Set();
const LOADED_TOPICS: Set<string> = new Set();
let DEBUG: boolean = false;

function cleanupTopic(topic: string) {
    let cleaned = topic.replace(" ", "_");

    if (cleaned.startsWith(WIKI_URL_PREFIX)) {
        cleaned = cleaned.substring(WIKI_URL_PREFIX.length);
    } else if (cleaned.startsWith(WIKI_RELATIVE_PREFIX)) {
        cleaned = cleaned.substring(WIKI_RELATIVE_PREFIX.length);
    }

    cleaned = encodeURI(cleaned);
    return cleaned;
}

async function getLinksToTopic(topic: string): Promise<string[]> {
    LOADED_TOPICS.add(topic);
    const url = new URL(`${WIKI_URL_PREFIX}${topic}`);

    const { data, status } = await axios.get(url.toString(), {
        headers: {
            Accept: "text/html"
        },
        responseType: "text",
        validateStatus: (_status) => true
    });

    if (status === 404) {
        return [];
    } else if (status !== 200) {
        throw new Error(`Could not retrieve topic ${topic}, got status code ${status}.`);
    }

    const jq = cheerio.load(data)
    const links = jq('div[id="content"] a').toArray()
    const result = new Set(links.filter((current, _index) => {
        return 'href' in current.attribs;
    }).map((current, _index) => {
        return current.attribs["href"];
    }).filter((value, _index) => {
        return value.startsWith(WIKI_RELATIVE_PREFIX);
    }).map(cleanupTopic)
    .filter((value, _index) => {
        return !value.startsWith("Wikipedia:") &&
               !value.startsWith("File:") &&
               !value.startsWith("Help:") &&
               !value.startsWith("Category:") &&
               !value.startsWith("Template:") &&
               !value.startsWith("Template_talk:") &&
               !value.startsWith("Special:") &&
               !value.startsWith("Portal:") &&
               !value.endsWith("redlink=1");
    }));
    return Array.from(result);
}

async function desperatelySeekingBacon(topics: string[], depth: number): Promise<number> {
    if (topics.includes(TARGET_TOPIC)) {
        return depth;
    }

    // Split the list of topics into reasonably sized chunks and get the lists of links for every topic at this depth.
    if (DEBUG) console.debug(`Scanning ${topics.length} topics at depth ${depth}.`)

    let links: string[] = [];
    let newLinks: string[] = [];

    for (let i = 0; i < topics.length; i += 20) {
        const topicSlice = topics.slice(i, i + 20);
        if (DEBUG) console.debug(`Processing ${i + 1}/${topics.length}...`);
        const sliceResults = await Promise.allSettled(topicSlice.map(topic => getLinksToTopic(topic)));
        const sliceLinks = sliceResults.filter(result => result.status === 'fulfilled')
            .map(result => result as PromiseFulfilledResult<string[]>)
            .map(result => result.value)
            .flat();
        links = links.concat(sliceLinks);
        const sliceNewLinks = sliceLinks.filter(link => !EXPLORED_TOPICS.has(link));
        sliceNewLinks.forEach(link => EXPLORED_TOPICS.add(link));
        newLinks = newLinks.concat(sliceNewLinks)

        // Avoid having to load additional web pages if we can already determine that our target is included in the
        // list of topics.
        if (sliceNewLinks.includes(TARGET_TOPIC)) {
            return depth + 1;
        }
    }

    if (DEBUG) console.debug(`Found ${links.length} links at this depth. Of those, ${newLinks.length} are new.`);

    // Dead end check.  If we have run out of links, throw an error.
    if (newLinks.length === 0) {
        throw new Error(`Could not find ${TARGET_TOPIC} after checking at a depth of ${depth}.`);
    }

    return desperatelySeekingBacon(newLinks, depth + 1);
}

const cmd = program.command("bacon")
    .description("Goes wiki-diving from the topic of your choice in search of Bacon.  Kevin Bacon.")
    .argument("<topic>", "Wikipedia topic to start diving from. Can be either a URL or topic string (case sensitive).", cleanupTopic)
    .option("-d --debug", "Displays debugging information upon completion.")
    .option("-t --trail", "Show the resulting trail of topics leading to the Bacon number.")
    .version(pkg.version)
    .parse();

const args: string[] = cmd.processedArgs;
let topic = args[0]
DEBUG = cmd.opts()["debug"]

if (DEBUG) console.log(`Starting from ${topic}.`);

desperatelySeekingBacon([ topic ], 0)
    .then(depth => console.log(`The Bacon Number for ${topic} is ${depth}.`))
    .catch(error => console.error(`Failed to get Bacon Number: ${error}`))
    .finally(() => {
        if (DEBUG) {
            console.log(`Explored topics size is ${EXPLORED_TOPICS.size}.`);
            console.log(`Loaded topics size is ${LOADED_TOPICS.size}.`);
        }
        return;
    });
