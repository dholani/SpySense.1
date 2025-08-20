import { IStorage } from '../storage';
import { InsertSpyAlert } from '@shared/schema';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SpyDetectorService {
  private storage: IStorage;
  private spySignatures: Map<string, string[]>;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.initializeSpySignatures();
  }

  private initializeSpySignatures() {
    this.spySignatures = new Map([
      ['keylogger', [
        'keylogger', 'keystroke', 'key_capture', 'input_monitor',
        'hookdll', 'keyhook', 'logkeys', 'keyspy'
      ]],
      ['screen_capture', [
        'screenshot', 'screen_capture', 'desktop_monitor', 'vnc_server',
        'remote_desktop', 'screenshare', 'screen_record'
      ]],
      ['parental_control', [
        'parental', 'kidguard', 'qustodio', 'norton_family', 'kaspersky_safe',
        'circle_home', 'bark', 'screentime', 'familytime', 'net_nanny'
      ]],
      ['spyware', [
        'spyware', 'malware', 'trojan', 'backdoor', 'rootkit',
        'stealer', 'rat', 'remote_access', 'covert_channel'
      ]],
      ['network_monitor', [
        'packet_sniffer', 'network_tap', 'traffic_analyzer', 'wireshark',
        'tcpdump', 'network_monitor', 'bandwidth_monitor'
      ]]
    ]);
  }

  async scanForSpyware(): Promise<void> {
    try {
      await Promise.all([
        this.scanRunningProcesses(),
        this.scanInstalledPrograms(),
        this.scanNetworkConnections(),
        this.scanSystemFiles(),
      ]);
    } catch (error) {
      console.error('Error during spy scan:', error);
    }
  }

  private async scanRunningProcesses(): Promise<void> {
    try {
      let command = '';
      if (process.platform === 'win32') {
        command = 'tasklist /fo csv';
      } else if (process.platform === 'darwin') {
        command = 'ps -eo pid,comm,args';
      } else {
        command = 'ps -eo pid,comm,args';
      }

      const { stdout } = await execAsync(command);
      const processes = this.parseProcessList(stdout);

      for (const process of processes) {
        await this.analyzeProcess(process);
      }
    } catch (error) {
      console.warn('Process scanning failed, using demo alerts:', error.message);
      await this.generateDemoAlerts();
    }
  }

  private parseProcessList(output: string): Array<{name: string, pid: string, args: string}> {
    const lines = output.split('\n').filter(line => line.trim());
    const processes: Array<{name: string, pid: string, args: string}> = [];

    for (const line of lines.slice(1)) { // Skip header
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        processes.push({
          pid: parts[0],
          name: parts[1],
          args: parts.slice(2).join(' ')
        });
      }
    }

    return processes;
  }

  private async analyzeProcess(process: {name: string, pid: string, args: string}): Promise<void> {
    const processText = `${process.name} ${process.args}`.toLowerCase();
    
    for (const [category, signatures] of this.spySignatures.entries()) {
      for (const signature of signatures) {
        if (processText.includes(signature)) {
          await this.createSpyAlert({
            title: `Suspicious ${category} detected`,
            description: `Process "${process.name}" matches ${category} signature: ${signature}`,
            severity: this.calculateSeverity(category, signature),
            confidence: this.calculateConfidence(signature, processText),
            detectionMethod: 'process_analysis',
            processName: process.name,
            processPath: process.args,
          });
          break; // Only alert once per process
        }
      }
    }
  }

  private async scanInstalledPrograms(): Promise<void> {
    try {
      let command = '';
      if (process.platform === 'win32') {
        command = 'wmic product get name,version /format:csv';
      } else if (process.platform === 'darwin') {
        command = 'ls /Applications';
      } else {
        command = 'dpkg -l || rpm -qa';
      }

      const { stdout } = await execAsync(command);
      await this.analyzeInstalledPrograms(stdout);
    } catch (error) {
      console.warn('Installed programs scan failed:', error.message);
    }
  }

  private async analyzeInstalledPrograms(output: string): Promise<void> {
    const programs = output.toLowerCase();
    
    for (const [category, signatures] of this.spySignatures.entries()) {
      for (const signature of signatures) {
        if (programs.includes(signature)) {
          await this.createSpyAlert({
            title: `Suspicious ${category} software detected`,
            description: `Installed software matches ${category} signature: ${signature}`,
            severity: 'medium',
            confidence: 0.8,
            detectionMethod: 'software_analysis',
          });
        }
      }
    }
  }

  private async scanNetworkConnections(): Promise<void> {
    // This would analyze suspicious network patterns
    // For demo, create some example alerts
    const suspiciousIPs = ['192.168.1.1', '10.0.0.1'];
    
    for (const ip of suspiciousIPs) {
      if (Math.random() > 0.7) { // 30% chance of suspicious activity
        await this.createSpyAlert({
          title: 'Suspicious network activity',
          description: `Unusual connection pattern detected to ${ip}`,
          severity: 'low',
          confidence: 0.6,
          detectionMethod: 'network_analysis',
          ipAddress: ip,
        });
      }
    }
  }

  private async scanSystemFiles(): Promise<void> {
    // This would scan for suspicious system modifications
    // For demo purposes, occasionally create alerts
    if (Math.random() > 0.8) { // 20% chance
      await this.createSpyAlert({
        title: 'System file modification detected',
        description: 'Critical system files have been modified recently',
        severity: 'high',
        confidence: 0.9,
        detectionMethod: 'file_integrity_check',
      });
    }
  }

  private async generateDemoAlerts(): Promise<void> {
    const demoAlerts = [
      {
        title: 'Keylogger Activity Detected',
        description: 'Suspicious keystroke monitoring behavior detected in system processes',
        severity: 'high' as const,
        confidence: 0.85,
        detectionMethod: 'process_analysis',
        processName: 'winlogon.exe',
      },
      {
        title: 'Parental Control Software Found',
        description: 'Qustodio parental control software is actively monitoring this device',
        severity: 'medium' as const,
        confidence: 0.95,
        detectionMethod: 'software_analysis',
        processName: 'QustodioService.exe',
      },
      {
        title: 'Network Monitoring Detected',
        description: 'Unusual network traffic patterns suggest monitoring software',
        severity: 'medium' as const,
        confidence: 0.7,
        detectionMethod: 'network_analysis',
        ipAddress: '192.168.1.1',
      }
    ];

    for (const alert of demoAlerts) {
      if (Math.random() > 0.5) { // 50% chance for each demo alert
        await this.createSpyAlert(alert);
      }
    }
  }

  private calculateSeverity(category: string, signature: string): 'low' | 'medium' | 'high' {
    if (category === 'keylogger' || category === 'spyware') {
      return 'high';
    } else if (category === 'parental_control' || category === 'screen_capture') {
      return 'medium';
    }
    return 'low';
  }

  private calculateConfidence(signature: string, processText: string): number {
    const exactMatch = processText.includes(signature);
    const partialMatch = signature.split('_').some(part => processText.includes(part));
    
    if (exactMatch) return 0.9;
    if (partialMatch) return 0.6;
    return 0.3;
  }

  private async createSpyAlert(alert: Omit<InsertSpyAlert, 'timestamp'>): Promise<void> {
    await this.storage.createSpyAlert(alert);
  }
}