import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'

const SystemHealth = () => {
  const healthStatus = [
    { service: 'API Server', status: 'Healthy', uptime: '99.9%' },
    { service: 'Database', status: 'Healthy', uptime: '99.8%' },
    { service: 'Cron Jobs', status: 'Running', uptime: '100%' },
    { service: 'Email Service', status: 'Healthy', uptime: '99.5%' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">System Health</h1>
        <p className="text-secondary-text mt-1">Monitor system status and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {healthStatus.map((item, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-text">{item.service}</h3>
              <Badge variant={item.status === 'Healthy' || item.status === 'Running' ? 'success' : 'danger'}>
                {item.status}
              </Badge>
            </div>
            <div className="text-sm text-secondary-text">
              Uptime: <span className="font-semibold text-primary-text">{item.uptime}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SystemHealth
