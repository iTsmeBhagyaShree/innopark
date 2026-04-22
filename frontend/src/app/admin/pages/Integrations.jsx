import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'

const Integrations = () => {
  const [integrations, setIntegrations] = useState([
    { id: 1, name: 'Stripe', description: 'Payment processing', enabled: true },
    { id: 2, name: 'Email', description: 'Email notifications', enabled: true },
    { id: 3, name: 'WhatsApp', description: 'WhatsApp messaging', enabled: false },
    { id: 4, name: 'Slack', description: 'Team communication', enabled: false },
  ])

  const toggleIntegration = (id) => {
    setIntegrations(
      integrations.map((int) =>
        int.id === id ? { ...int, enabled: !int.enabled } : int
      )
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Integrations</h1>
        <p className="text-secondary-text mt-1">Manage third-party integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary-text">
                  {integration.name}
                </h3>
                <p className="text-sm text-secondary-text mt-1">
                  {integration.description}
                </p>
              </div>
              <Badge variant={integration.enabled ? 'success' : 'default'}>
                {integration.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Button
              variant={integration.enabled ? 'outline' : 'primary'}
              onClick={() => toggleIntegration(integration.id)}
              className="w-full"
            >
              {integration.enabled ? 'Disable' : 'Enable'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Integrations
