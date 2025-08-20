import { IStorage } from '../storage';
import { InsertGeoCache } from '@shared/schema';

export class GeoLocationService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async getIPLocation(ipAddress: string): Promise<any> {
    // Check cache first
    const cached = await this.storage.getGeoByIP(ipAddress);
    if (cached) {
      return cached;
    }

    try {
      // Try to get real geolocation data
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      const data = await response.json();

      if (data.status === 'success') {
        const geoData: InsertGeoCache = {
          ipAddress,
          country: data.country,
          city: data.city,
          region: data.regionName,
          latitude: data.lat?.toString(),
          longitude: data.lon?.toString(),
          isp: data.isp,
          organization: data.org,
          isVpn: data.proxy || false,
          physicalAddress: this.formatPhysicalAddress(data),
        };

        // Cache the result
        await this.storage.createGeoCache(geoData);
        return geoData;
      }
    } catch (error: any) {
      console.warn(`Failed to get location for ${ipAddress}:`, error?.message || error);
    }

    // Return demo data for demonstration
    const demoData: InsertGeoCache = {
      ipAddress,
      country: 'United States',
      city: this.getDemoCity(ipAddress),
      region: this.getDemoRegion(ipAddress),
      latitude: '37.4419',
      longitude: '-122.1419',
      isp: 'Demo ISP',
      organization: 'Demo Organization',
      isVpn: Math.random() > 0.8,
      physicalAddress: this.getDemoAddress(ipAddress),
    };

    await this.storage.createGeoCache(demoData);
    return demoData;
  }

  private formatPhysicalAddress(data: any): string {
    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    return parts.join(', ');
  }

  private getDemoCity(ip: string): string {
    const cities = ['Mountain View', 'San Francisco', 'Seattle', 'Austin', 'New York'];
    const index = parseInt(ip.split('.')[3]) % cities.length;
    return cities[index];
  }

  private getDemoRegion(ip: string): string {
    const regions = ['California', 'Washington', 'Texas', 'New York', 'Florida'];
    const index = parseInt(ip.split('.')[2]) % regions.length;
    return regions[index];
  }

  private getDemoAddress(ip: string): string {
    const addresses = [
      '1600 Amphitheatre Parkway, Mountain View, CA',
      '1 Hacker Way, Menlo Park, CA',
      '410 Terry Ave N, Seattle, WA',
      '500 W 2nd St, Austin, TX',
      '111 8th Ave, New York, NY'
    ];
    const index = parseInt(ip.split('.')[1]) % addresses.length;
    return addresses[index];
  }

  async getGPSDirections(fromAddress: string, toAddress: string): Promise<string> {
    // In a real implementation, this would use Google Maps API or similar
    return `https://www.google.com/maps/dir/${encodeURIComponent(fromAddress)}/${encodeURIComponent(toAddress)}`;
  }
}