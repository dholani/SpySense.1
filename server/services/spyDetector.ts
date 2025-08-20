import { exec } from 'child_process';
import { promisify } from 'util';
import { storage } from '../storage';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface SpywareSignature {
  name: string;
  processes: string[];
  files: string[];
  registryKeys?: string[];
  networkPatterns: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SpyDetector {
  private spywareDatabase: SpywareSignature[] = [
    {
      name: 'Qustodio Parental Control',
      processes: ['qustodio.exe', 'qustodioservice.exe', 'qustodiotray.exe'],
      files: [
        'C:\\Program Files\\Qustodio',
        'C:\\Program Files (x86)\\Qustodio',
        '/Applications/Qustodio.app'
      ],
      networkPatterns: ['qustodio.com', 'qustodio-production.s3.amazonaws.com'],
      description: 'Qustodio parental control software detected',
      severity: 'high'
    },
    {
      name: 'FlexiSpy',
      processes: ['flexispy.exe', 'flexiagent.exe'],
      files: [
        'C:\\Windows\\System32\\flexispy',
        '/System/Library/LaunchDaemons/flexispy'
      ],
      networkPatterns: ['flexispy.com', 'my.flexispy.com'],
      description: 'FlexiSpy surveillance software detected',
      severity: 'critical'
    },
    {
      name: 'mSpy',
      processes: ['mspy.exe', 'mspyservice.exe'],
      files: [
        'C:\\Program Files\\mSpy',
        '/Library/Application Support/mspy'
      ],
      networkPatterns: ['mspy.com', 'cp.mspy.com'],
      description: 'mSpy monitoring software detected',
      severity: 'critical'
    },
    {
      name: 'Circle Home Plus',
      processes: ['circle.exe', 'circleservice.exe'],
      files: [
        'C:\\Program Files\\Circle Media Inc',
        '/Applications/Circle Home Plus.app'
      ],
      networkPatterns: ['meetcircle.com', 'api.meetcircle.com'],
      description: 'Circle Home Plus parental control detected',
      severity: 'medium'
    },
    {
      name: 'Norton Family',
      processes: ['nortonFamily.exe', 'nfservice.exe'],
      files: [
        'C:\\Program Files\\Norton Family',
        'C:\\Program Files (x86)\\Norton Family'
      ],
      networkPatterns: ['family.norton.com', 'nf.symantec.com'],
      description: 'Norton Family parental control detected',
      severity: 'medium'
    },
    {
      name: 'Spyzie',
      processes: ['spyzie.exe', 'spyzieagent.exe'],
      files: [
        'C:\\Windows\\System32\\spyzie',
        '/System/Library/PrivateFrameworks/spyzie'
      ],
      networkPatterns: ['spyzie.com', 'app.spyzie.com'],
      description: 'Spyzie surveillance software detected',
      severity: 'critical'
    },
    {
      name: 'KidsGuard Pro',
      processes: ['kidsguard.exe', 'kgsvc.exe'],
      files: [
        'C:\\Program Files\\KidsGuard',
        '/Library/Application Support/KidsGuard'
      ],
      networkPatterns: ['clevguard.com', 'kidsguard.com'],
      description: 'KidsGuard Pro monitoring software detected',
      severity: 'high'
    },
    {
      name: 'Cocospy',
      processes: ['cocospy.exe', 'cocospyservice.exe'],
      files: [
        'C:\\Windows\\System32\\cocospy'
      ],
      networkPatterns: ['cocospy.com', 'app.cocospy.com'],
      description: 'Cocospy surveillance software detected',
      severity: 'critical'
    },
    {
      name: 'Net Nanny',
      processes: ['netnanny.exe', 'nnservice.exe'],
      files: [
        'C:\\Program Files\\Net Nanny',
        'C:\\Program Files (x86)\\Net Nanny'
      ],
      networkPatterns: ['netnanny.com', 'portal.netnanny.com'],
      description: 'Net Nanny parental control detected',
      severity: 'medium'
    },
    {
      name: 'Kaspersky Safe Kids',
      processes: ['ksc.exe', 'safekids.exe'],
      files: [
        'C:\\Program Files\\Kaspersky Lab\\Safe Kids',
        'C:\\Program Files (x86)\\Kaspersky Lab\\Safe Kids'
      ],
      networkPatterns: ['safekids.kaspersky.com', 'ksn.kaspersky.com'],
      description: 'Kaspersky Safe Kids parental control detected',
      severity: 'medium'
    }
  ];

  async runFullSystemScan(): Promise<{
    spywareFound: SpywareSignature[];
    suspiciousProcesses: string[];
    suspiciousFiles: string[];
    scanDuration: number;
  }> {
    const startTime = Date.now();
    const scanResults = {
      spywareFound: [] as SpywareSignature[],
      suspiciousProcesses: [] as string[],
      suspiciousFiles: [] as string[],
      scanDuration: 0
    };

    try {
      // Create scan record
      const scanRecord = await storage.createSystemScan({
        scanType: 'full',
        status: 'running',
        findings: null,
        threatsFound: 0,
      });

      // Scan running processes
      const runningProcesses = await this.getRunningProcesses();
      
      // Check for known spyware
      for (const spyware of this.spywareDatabase) {
        const foundProcesses = runningProcesses.filter(proc => 
          spyware.processes.some(spyProc => 
            proc.toLowerCase().includes(spyProc.toLowerCase().replace('.exe', ''))
          )
        );

        if (foundProcesses.length > 0) {
          scanResults.spywareFound.push(spyware);
          
          // Create alert
          await storage.createSpyAlert({
            title: `${spyware.name} Detected`,
            description: `${spyware.description}. Detected processes: ${foundProcesses.join(', ')}`,
            severity: spyware.severity,
            detectionMethod: 'Process Monitoring',
            processName: foundProcesses[0],
            confidence: 95,
          });
        }
      }

      // Scan file system for known spyware paths
      for (const spyware of this.spywareDatabase) {
        for (const filePath of spyware.files) {
          try {
            await fs.access(filePath);
            if (!scanResults.spywareFound.includes(spyware)) {
              scanResults.spywareFound.push(spyware);
              
              await storage.createSpyAlert({
                title: `${spyware.name} Installation Detected`,
                description: `${spyware.description}. Found installation at: ${filePath}`,
                severity: spyware.severity,
                detectionMethod: 'File System Scan',
                processPath: filePath,
                confidence: 90,
              });
            }
            scanResults.suspiciousFiles.push(filePath);
          } catch {
            // File doesn't exist, continue
          }
        }
      }

      // Look for suspicious processes (generic detection)
      const suspiciousPatterns = [
        'keylog', 'monitor', 'spy', 'track', 'watch', 'capture',
        'remote', 'vnc', 'rdp', 'teamviewer', 'anydesk'
      ];

      for (const process of runningProcesses) {
        for (const pattern of suspiciousPatterns) {
          if (process.toLowerCase().includes(pattern) && 
              !this.isKnownLegitimateProcess(process)) {
            scanResults.suspiciousProcesses.push(process);
            
            await storage.createSpyAlert({
              title: 'Suspicious Process Detected',
              description: `Process "${process}" contains suspicious patterns and may be monitoring software`,
              severity: 'medium',
              detectionMethod: 'Pattern Analysis',
              processName: process,
              confidence: 60,
            });
            break;
          }
        }
      }

      scanResults.scanDuration = Math.floor((Date.now() - startTime) / 1000);

      // Update scan record
      await storage.updateSystemScan(scanRecord.id, {
        status: 'completed',
        findings: scanResults,
        threatsFound: scanResults.spywareFound.length + scanResults.suspiciousProcesses.length,
        duration: scanResults.scanDuration,
      });

      return scanResults;
    } catch (error) {
      console.error('System scan failed:', error);
      scanResults.scanDuration = Math.floor((Date.now() - startTime) / 1000);
      return scanResults;
    }
  }

  async analyzeProcess(processName: string, connectedIP?: string): Promise<void> {
    try {
      // Check against known spyware database
      for (const spyware of this.spywareDatabase) {
        const isMatch = spyware.processes.some(spyProc => 
          processName.toLowerCase().includes(spyProc.toLowerCase().replace('.exe', ''))
        );

        if (isMatch) {
          await storage.createSpyAlert({
            title: `${spyware.name} Network Activity`,
            description: `${spyware.description}. Process "${processName}" is communicating with external servers.`,
            severity: spyware.severity,
            detectionMethod: 'Network Analysis',
            processName,
            ipAddress: connectedIP,
            confidence: 85,
          });
          return;
        }
      }

      // Check for suspicious network behavior
      if (connectedIP && this.isSuspiciousNetworkBehavior(processName, connectedIP)) {
        await storage.createSpyAlert({
          title: 'Suspicious Network Activity',
          description: `Process "${processName}" is making suspicious network connections to ${connectedIP}`,
          severity: 'medium',
          detectionMethod: 'Network Behavior Analysis',
          processName,
          ipAddress: connectedIP,
          confidence: 70,
        });
      }
    } catch (error) {
      console.error('Process analysis failed:', error);
    }
  }

  private async getRunningProcesses(): Promise<string[]> {
    try {
      const command = process.platform === 'win32' 
        ? 'wmic process get name /format:csv'
        : 'ps -eo comm --no-headers';

      const { stdout } = await execAsync(command);
      
      if (process.platform === 'win32') {
        return stdout.split('\n')
          .slice(1) // Skip header
          .map(line => line.split(',')[1])
          .filter(name => name && name.trim())
          .map(name => name.trim());
      } else {
        return stdout.split('\n')
          .filter(name => name && name.trim())
          .map(name => name.trim());
      }
    } catch (error) {
      console.error('Failed to get running processes:', error);
      return [];
    }
  }

  private isKnownLegitimateProcess(processName: string): boolean {
    const legitProcesses = [
      'chrome', 'firefox', 'explorer', 'notepad', 'calculator',
      'winlogon', 'csrss', 'lsass', 'services', 'smss',
      'system', 'dwm', 'audiodg', 'svchost', 'conhost'
    ];

    return legitProcesses.some(legit => 
      processName.toLowerCase().includes(legit.toLowerCase())
    );
  }

  private isSuspiciousNetworkBehavior(processName: string, ip: string): boolean {
    // Check if process is making connections to suspicious IPs or patterns
    const suspiciousPatterns = [
      'temp', 'tmp', 'cache', 'hidden', '~', '$',
      'svchost', 'winlogon', 'csrss' // System processes shouldn't connect externally
    ];

    return suspiciousPatterns.some(pattern => 
      processName.toLowerCase().includes(pattern)
    );
  }

  async checkNetworkTraffic(ip: string): Promise<void> {
    try {
      // Check if IP matches known spyware domains
      for (const spyware of this.spywareDatabase) {
        for (const pattern of spyware.networkPatterns) {
          // This would need DNS reverse lookup in a real implementation
          if (pattern.includes(ip)) {
            await storage.createSpyAlert({
              title: `${spyware.name} Network Communication`,
              description: `Detected network communication with ${spyware.name} servers at ${ip}`,
              severity: spyware.severity,
              detectionMethod: 'Network Traffic Analysis',
              ipAddress: ip,
              confidence: 90,
            });
            break;
          }
        }
      }
    } catch (error) {
      console.error('Network traffic check failed:', error);
    }
  }
}

export const spyDetector = new SpyDetector();
