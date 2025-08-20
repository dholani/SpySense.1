interface StatsData {
  activeConnections: number;
  detectedThreats: number;
  uniqueIPs: number;
  vpnConnections: number;
}

interface StatusCardsProps {
  stats?: StatsData;
}

export default function StatusCards({ stats }: StatusCardsProps) {
  const cards = [
    {
      title: 'Active Connections',
      value: stats?.activeConnections || 0,
      icon: 'fas fa-plug',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      change: '+12%',
      changeType: 'increase',
      subtitle: 'vs last hour',
      testId: 'card-active-connections'
    },
    {
      title: 'Detected Threats',
      value: stats?.detectedThreats || 0,
      icon: 'fas fa-exclamation-triangle',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      badge: stats?.detectedThreats && stats.detectedThreats > 0 ? 'HIGH PRIORITY' : undefined,
      badgeColor: 'bg-red-600',
      testId: 'card-detected-threats'
    },
    {
      title: 'Unique IPs (24h)',
      value: stats?.uniqueIPs || 0,
      icon: 'fas fa-globe',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      subtitle: 'From multiple countries',
      testId: 'card-unique-ips'
    },
    {
      title: 'VPN Detected',
      value: stats?.vpnConnections || 0,
      icon: 'fas fa-mask',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      subtitle: 'Possible privacy tools',
      testId: 'card-vpn-connections'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div 
          key={card.title}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          data-testid={card.testId}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2" data-testid={`${card.testId}-value`}>
                {card.value}
              </p>
            </div>
            <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
              <i className={`${card.icon} ${card.iconColor} text-xl`}></i>
            </div>
          </div>
          
          <div className="flex items-center mt-4 text-sm">
            {card.change && (
              <>
                <i className={`fas fa-arrow-up text-green-600 mr-1`}></i>
                <span className="text-green-600 font-medium">{card.change}</span>
                <span className="text-gray-600 ml-1">{card.subtitle}</span>
              </>
            )}
            
            {card.badge && (
              <span className={`${card.badgeColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                {card.badge}
              </span>
            )}
            
            {!card.change && !card.badge && card.subtitle && (
              <span className="text-gray-600">{card.subtitle}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
