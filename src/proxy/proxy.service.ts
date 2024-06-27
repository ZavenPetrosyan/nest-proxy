// import { Injectable } from '@nestjs/common';
// import * as cheerio from 'cheerio';
// import axios from 'axios';
// import * as fs from 'fs';

// @Injectable()
// export class ProxyService {
//   constructor() {}

//   async fetchAndModifyContent(url: string): Promise<string> {
//     const response = await axios.get(url);
//     const $ = cheerio.load(response.data);
  
//     // Function to modify six-letter words
//     const modifyText = (text: string) => text.replace(/\b\w{6}\b/g, (match) => `${match}™`);
  
//     // Function to recursively modify text nodes
//     const traverseAndModify = (node: cheerio.Element) => {
//       $(node).contents().each((i, child) => {
//         if (child.type === 'text') {
//           child.data = modifyText(child.data);
//         } else if (child.type === 'tag' && child.tagName !== 'script') {
//           traverseAndModify(child);
//         }
//       });
//     };
  
//     // Start traversal from the body element
//     traverseAndModify($('body')[0]);
  
//     // Update internal links
//     $('a[href^="/"]').each((i, elem) => {
//       const originalHref = $(elem).attr('href');
//       if (originalHref) {
//         $(elem).attr('href', `/proxy?url=${originalHref}`);
//       }
//     });
  
//     const modifiedHtml = $.html();
//     fs.writeFileSync('output.html', modifiedHtml); // Write to file for inspection
  
//     return modifiedHtml;
//   }  
// }

import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProxyService {
  constructor() {}

  async fetchAndModifyContent(url: string): Promise<string> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Function to modify six-letter words
    const modifyText = (text: string) => text.replace(/\b\w{6}\b/g, (match) => `${match}™`);

    // Function to recursively modify text nodes
    const traverseAndModify = (node: cheerio.Cheerio<cheerio.Element>) => {
      node.contents().each((i, child) => {
        if (child.type === 'text') {
          child.data = modifyText(child.data);
        } else if (child.type === 'tag' && child.tagName !== 'script' && child.tagName !== 'style') {
          traverseAndModify($(child));
        }
      });
    };

    // Start traversal from the body element
    traverseAndModify($('body'));

    // Update internal links
    $('a[href^="/"]').each((i, elem) => {
      const originalHref = $(elem).attr('href');
      if (originalHref) {
        $(elem).attr('href', `/proxy?url=${originalHref}`);
      }
    });

    // Fetch and inline critical CSS and JS files
    const inlineResource = async (url: string, attribute: string) => {
      try {
        const resourceResponse = await axios.get(url);
        if (attribute === 'href') {
          $('head').append(`<style>${resourceResponse.data}</style>`);
        } else if (attribute === 'src') {
          $('body').append(`<script>${resourceResponse.data}</script>`);
        }
      } catch (error) {
        console.error(`Failed to fetch resource: ${url}`, error);
      }
    };

    // Process link and script tags
    const processResourceTags = async () => {
      const linkTags = $('link[rel="stylesheet"][href]').toArray();
      const scriptTags = $('script[src]').toArray();

      for (const tag of linkTags) {
        const href = $(tag).attr('href');
        if (href && !href.startsWith('http')) {
          await inlineResource(new URL(href, url).href, 'href');
        }
      }

      for (const tag of scriptTags) {
        const src = $(tag).attr('src');
        if (src && !src.startsWith('http')) {
          await inlineResource(new URL(src, url).href, 'src');
        }
      }
    };

    await processResourceTags();

    // Update remaining resource links to absolute URLs
    $('link[href], script[src], img[src]').each((i, elem) => {
      const attribute = $(elem).attr('href') ? 'href' : 'src';
      const originalUrl = $(elem).attr(attribute);
      if (originalUrl && !originalUrl.startsWith('http')) {
        $(elem).attr(attribute, new URL(originalUrl, url).href);
      }
    });

    const modifiedHtml = $.html();
    fs.writeFileSync(path.join(__dirname, 'output.html'), modifiedHtml); // Write to file for inspection
    console.log(modifiedHtml); // Log to console for inspection

    return modifiedHtml;
  }
}

