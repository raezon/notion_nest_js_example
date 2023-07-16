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
        database_id: process.env.DATABASE_ID_INTERVENTION,
      });

      const interventionList = await response.results.map(async (page) => {
        const { id, properties } = page as any; // Type assertion

        const nom = properties?.nom?.rich_text?.[0]?.plain_text;
        const siteIds =
          properties?.site?.relation?.map((relation) => relation.id) || [];
        const sitePromises = siteIds.map((siteId) =>
          notion.pages.retrieve({ page_id: siteId }),
        );
        const sitePages = await Promise.all(sitePromises);

        const site = sitePages.map((sitePage) => {
          return {
            id: sitePage.id,
            address:
              sitePage.properties?.Addresse?.rich_text?.[0]?.plain_text ||
              'N/A',
            latitude: sitePage.properties?.Latitude?.number || null,
            longitude: sitePage.properties?.Longitude?.number || null,
          };
        });

        return {
          id,
          nom,
          latitude: site[0].latitude,
          longitude: site[0].longitude,
        };
      });
      const interventionListPromises = await Promise.all(interventionList);
      return interventionListPromises;
    } catch (error) {
      if (error.code === APIErrorCode.ObjectNotFound) {
        // Handle the error when the database is not found
      } else {
        // Handle other errors
        console.error(error);
      }
    }
  }
  async getInterventionList() {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const response = await notion.databases.query({
      database_id: process.env.DATABASE_ID_INTERVENTION,
    });
    const interventionList = await response.results.map(async (page) => {
      const { id, properties } = page as any; // Type assertion

      const nom = properties?.nom?.rich_text?.[0]?.plain_text;
      const date_heure = properties?.date_heure?.date?.start || null;
      // Retrieve the related "site" pages
      const siteIds =
        properties?.site?.relation?.map((relation) => relation.id) || [];
      const sitePromises = siteIds.map((siteId) =>
        notion.pages.retrieve({ page_id: siteId }),
      );
      const sitePages = await Promise.all(sitePromises);

      const site = sitePages.map((sitePage) => {
        return {
          id: sitePage.id,
          address:
            sitePage.properties?.Addresse?.rich_text?.[0]?.plain_text || 'N/A',
          latitude: sitePage.properties?.Latitude?.number || null,
          longitude: sitePage.properties?.Longitude?.number || null,
        };
      });

      return {
        id,
        nom,
        site,
        // Include other properties in the returned object
      };
    });
    return await Promise.all(interventionList);
  }
  async getTechnicienList() {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const response = await notion.databases.query({
      database_id: process.env.DATABASE_ID_TECHNICIEN,
    });
    const technicienList = await response.results.map(async (page) => {
      const { id, properties } = page as any; // Type assertion

      const nom = properties?.Nom?.rich_text?.[0]?.plain_text;
      const prénom = properties?.Prénom?.rich_text?.[0]?.plain_text;
      const latitude = properties?.latitude?.number;
      const longitude = properties?.longitude?.number;
      // Retrieve the related "site" pages

      return {
        id,
        nom,
        prénom,
        latitude,
        longitude,
        // Include other properties in the returned object
      };
    });

    return await Promise.all(technicienList);
  }

  async planifier(intervention) {
    try {
      const startTime = new Date().getTime(); // Start timestamp

      const technicienList = await this.getTechnicienList();

      const {
        latitude: interventionLatitude,
        longitude: interventionLongitude,
      } = intervention;
      let nearestTechnician = null;
      let nearestDistance = Infinity;

      for (const technician of technicienList) {
        const { latitude: technicianLatitude, longitude: technicianLongitude } =
          technician;
        const distance = this.calculateDistance(
          interventionLatitude,
          interventionLongitude,
          technicianLatitude,
          technicianLongitude,
        );

        if (distance < nearestDistance) {
          nearestTechnician = technician;
          nearestDistance = distance;
        }
      }

      const assignedTechnicians = {
        interventionNom: intervention.interventionNom,
        technicianId: nearestTechnician.id,
        technicianNom: nearestTechnician.nom,
        technicianPrénom: nearestTechnician.prénom,
        // Include other properties in the returned object
      };

      const endTime = new Date().getTime(); // End timestamp
      const executionTime = endTime - startTime; // Execution time in milliseconds

      return { assignedTechnicians, executionTime };
    } catch (error) {
      // Handle errors
      console.error(error);
    }
  }

  // Helper function to calculate the distance between two coordinates using the Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}
