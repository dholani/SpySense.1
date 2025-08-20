import { storage } from '../storage';

export interface GeoLocationData {
  ipAddress: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  physicalAddress?: string;
  isp?: string;
  organization?: string;
  isVpn?: boolean;
}

export class GeoLocationService {
  private readonly ipApiUrl = 'http://ip-api.com/json';
  private readonly vpnDetectionUrl = 'https://ipapi.co';

  async getLocationData(ipAddress: string): Promise<GeoLocationData | null> {
    try {
      // Check cache first
      const cached = await storage.getGeoByIP(ipAddress);
      if (cached) {
        // Return cached data if it's less than 24 hours old
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (new Date(cached.lastUpdated) > oneDayAgo) {
          return {
            ipAddress: cached.ipAddress,
            country: cached.country || undefined,
            city: cached.city || undefined,
            region: cached.region || undefined,
            latitude: cached.latitude || undefined,
            longitude: cached.longitude || undefined,
            physicalAddress: cached.physicalAddress || undefined,
            isp: cached.isp || undefined,
            organization: cached.organization || undefined,
            isVpn: cached.isVpn || false,
          };
        }
      }

      // Fetch fresh data
      const geoData = await this.fetchLocationData(ipAddress);
      
      if (geoData) {
        // Cache the results
        if (cached) {
          await storage.updateGeoCache(ipAddress, {
            country: geoData.country,
            city: geoData.city,
            region: geoData.region,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            physicalAddress: geoData.physicalAddress,
            isp: geoData.isp,
            organization: geoData.organization,
            isVpn: geoData.isVpn,
          });
        } else {
          await storage.createGeoCache({
            ipAddress: geoData.ipAddress,
            country: geoData.country,
            city: geoData.city,
            region: geoData.region,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            physicalAddress: geoData.physicalAddress,
            isp: geoData.isp,
            organization: geoData.organization,
            isVpn: geoData.isVpn,
          });
        }
        
        return geoData;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get location for IP ${ipAddress}:`, error);
      return null;
    }
  }

  private async fetchLocationData(ipAddress: string): Promise<GeoLocationData | null> {
    try {
      // Use ip-api.com for basic geolocation (free, no API key required)
      const response = await fetch(`${this.ipApiUrl}/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,isp,org,proxy`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'fail') {
        console.error('IP-API error:', data.message);
        return null;
      }

      // Try to get more detailed VPN detection
      let isVpn = data.proxy || false;
      try {
        const vpnResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (vpnResponse.ok) {
          const vpnData = await vpnResponse.json();
          if (vpnData.threat_types && vpnData.threat_types.includes('vpn')) {
            isVpn = true;
          }
        }
      } catch (vpnError) {
        // VPN detection failed, use proxy flag from ip-api
        console.warn('VPN detection failed, using proxy flag');
      }

      // Generate approximate physical address
      const physicalAddress = this.generatePhysicalAddress(data);

      return {
        ipAddress,
        country: data.country,
        city: data.city,
        region: data.regionName,
        latitude: data.lat?.toString(),
        longitude: data.lon?.toString(),
        physicalAddress,
        isp: data.isp,
        organization: data.org,
        isVpn,
      };
      
    } catch (error) {
      console.error('Error fetching location data:', error);
      return null;
    }
  }

  private generatePhysicalAddress(geoData: any): string {
    const parts: string[] = [];
    
    if (geoData.isp && geoData.isp !== 'Unknown') {
      // For ISPs and organizations, use their known addresses
      const knownAddresses = this.getKnownISPAddresses(geoData.isp, geoData.org);
      if (knownAddresses) {
        return knownAddresses;
      }
      
      parts.push(geoData.isp + ' Data Center');
    }
    
    if (geoData.city) parts.push(geoData.city);
    if (geoData.regionName) parts.push(geoData.regionName);
    if (geoData.country) parts.push(geoData.country);
    
    return parts.join(', ') || 'Location data unavailable';
  }

  private getKnownISPAddresses(isp: string, org: string): string | null {
    const knownAddresses: { [key: string]: string } = {
      'Google LLC': '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
      'Amazon.com': '410 Terry Avenue North, Seattle, WA 98109, USA',
      'Amazon Data Services': 'AWS Data Center, Various Locations',
      'Microsoft Corporation': '1 Microsoft Way, Redmond, WA 98052, USA',
      'Facebook, Inc.': '1 Hacker Way, Menlo Park, CA 94301, USA',
      'Cloudflare, Inc.': '101 Townsend St, San Francisco, CA 94107, USA',
      'DigitalOcean': '101 Avenue of the Americas, New York, NY 10013, USA',
      'Linode': '249 Arch St, Philadelphia, PA 19106, USA',
      'Vultr': '103 Terrace Hall Ave, Burlington, NJ 08016, USA',
    };

    // Check both ISP and organization names
    for (const [key, address] of Object.entries(knownAddresses)) {
      if (isp?.includes(key) || org?.includes(key)) {
        return address;
      }
    }

    // Check for VPN providers
    const vpnProviders: { [key: string]: string } = {
      'NordVPN': 'VPN Server Location - Privacy Protected',
      'ExpressVPN': 'VPN Server Location - Privacy Protected',
      'Surfshark': 'VPN Server Location - Privacy Protected',
      'CyberGhost': 'VPN Server Location - Privacy Protected',
      'ProtonVPN': 'VPN Server Location - Privacy Protected',
      'Private Internet Access': 'VPN Server Location - Privacy Protected',
    };

    for (const [key, address] of Object.entries(vpnProviders)) {
      if (isp?.includes(key) || org?.includes(key)) {
        return address;
      }
    }

    return null;
  }

  async performReverseGeocode(latitude: string, longitude: string): Promise<string | null> {
    try {
      // Use OpenStreetMap Nominatim for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DeviceGuard-Pro/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }
}

export const geoLocationService = new GeoLocationService();
