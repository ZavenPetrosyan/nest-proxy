import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProxyService {
  constructor(private readonly httpService: HttpService) {}

  async fetchAndModify(url: string): Promise<string> {
    console.log(`Fetching URL: ${url}`);
    try {
      const response = await lastValueFrom(this.httpService.get(url));
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);
      console.log('Response Data:', response.data);

      const $ = cheerio.load(response.data);

      // Update internal links
      $('a').each((i, link) => {
        const href = $(link).attr('href');
        if (href && href.startsWith('/')) {
          $(link).attr(
            'href',
            `http://localhost:3000/proxy?url=https://docs.nestjs.com${href}`,
          );
        }
      });

      // Update text content
      $('body *').each((i, elem) => {
        const text = $(elem).text();
        const modifiedText = text
          .split(' ')
          .map((word) => (word.length === 6 ? `${word}™` : word))
          .join(' ');
        $(elem).text(modifiedText);
      });

      const modifiedHtml = $.html();
      console.log('Modified HTML:', modifiedHtml);

      // Ensure the public directory exists
      const publicDir = path.join(__dirname, '..', 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }

      // Save the modified HTML to a file
      const filePath = path.join(publicDir, 'modified.html');
      fs.writeFileSync(filePath, modifiedHtml);

      return modifiedHtml;
    } catch (error) {
      if (error.response) {
        console.error('Response Data:', error.response.data);
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
      } else {
        console.error('Error Message:', error.message);
      }
      throw new HttpException(
        'Failed to fetch or modify content',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async fetchStaticFile(url: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );
      if (response.status >= 400) {
        throw new HttpException(
          'Failed to fetch static file',
          HttpStatus.BAD_REQUEST,
        );
      }
      return response;
    } catch (error) {
      if (error.response) {
        console.error('Static File Response Data:', error.response.data);
        console.error('Static File Response Status:', error.response.status);
        console.error('Static File Response Headers:', error.response.headers);
      } else {
        console.error('Static File Error Message:', error.message);
      }
      throw new HttpException(
        'Failed to fetch static file',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
