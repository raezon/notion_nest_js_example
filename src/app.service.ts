import { Injectable } from '@nestjs/common';
import { Client, APIErrorCode } from '@notionhq/client';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  async getIntervention() {
    try {
      const notion = new Client({ auth: process.env.NOTION_TOKEN });
      const response = await notion.databases.query({
        database_id: process.env.DATABASE_ID,
      });

      const interventionList = response.results.map((page) => {
        const { id, properties } = page as any; // Type assertion

        const nom = properties?.nom?.rich_text?.[0]?.plain_text;
        console.log(nom);
        return {
          id,
          nom,
          // Include other properties in the returned object
        };
      });

      return interventionList;
    } catch (error) {
      if (error.code === APIErrorCode.ObjectNotFound) {
        // Handle the error when the database is not found
      } else {
        // Handle other errors
        console.error(error);
      }
    }
  }
}
