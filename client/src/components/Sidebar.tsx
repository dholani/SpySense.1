import { Link, useLocation } from "wouter";

const navigationItems = [
  { icon: 'fas fa-tachometer-alt', label: 'Dashboard', path: '/' },
  { icon: 'fas fa-network-wired', label: 'IP Monitoring', path: '/monitoring' },
  { icon: 'fas fa-search', label: 'Spy Detection', path: '/detection' },
  { icon: 'fas fa-map-marker-alt', label: 'Location Tracking', path: '/location' },
  { icon: 'fas fa-history', label: 'History', path: '/history' },
  { icon: 'fas fa-download', label: 'Export Data', path: '/export' },
  { icon: 'fas fa-cog', label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-shield-alt text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900" data-testid="app-title">DeviceGuard</h1>
            <p className="text-sm text-gray-500">Pro Edition</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={item.icon}></i>
                  <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
