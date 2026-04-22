import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { IoBook, IoSearch, IoDocumentText, IoHelpCircle, IoCode, IoPeople, IoKey, IoServer } from 'react-icons/io5'

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      id: 1,
      title: 'Getting Started',
      icon: IoHelpCircle,
      color: 'bg-blue-100 text-blue-600',
      articles: [
        { title: 'Introduction to Super Admin', description: 'Learn the basics of managing your SaaS platform' },
        { title: 'First Steps', description: 'Setting up your first company and user' },
        { title: 'Dashboard Overview', description: 'Understanding the admin dashboard' },
      ],
    },
    {
      id: 2,
      title: 'Company Management',
      icon: IoPeople,
      color: 'bg-green-100 text-green-600',
      articles: [
        { title: 'Adding Companies', description: 'How to add and manage companies' },
        { title: 'Company Packages', description: 'Setting up subscription packages' },
        { title: 'Impersonating Companies', description: 'Login as a company admin' },
      ],
    },
    {
      id: 3,
      title: 'User & Permissions',
      icon: IoKey,
      color: 'bg-purple-100 text-purple-600',
      articles: [
        { title: 'Staff Management', description: 'Managing staff across all companies' },
        { title: 'Roles & Permissions', description: 'Setting up custom roles and permissions' },
        { title: 'Access Control', description: 'Understanding access levels' },
      ],
    },
    {
      id: 4,
      title: 'System Administration',
      icon: IoServer,
      color: 'bg-orange-100 text-orange-600',
      articles: [
        { title: 'License Management', description: 'Managing licenses and domain bindings' },
        { title: 'System Updates', description: 'Updating your system' },
        { title: 'Database Backup', description: 'Creating and managing backups' },
      ],
    },
    {
      id: 5,
      title: 'API & Integrations',
      icon: IoCode,
      color: 'bg-pink-100 text-pink-600',
      articles: [
        { title: 'API Documentation', description: 'Complete API reference guide' },
        { title: 'Zoho Books Integration', description: 'Connecting Zoho Books' },
        { title: 'QuickBooks Integration', description: 'Setting up QuickBooks' },
        { title: 'Payment Gateways', description: 'Configuring payment gateways' },
      ],
    },
  ]

  const popularArticles = [
    { title: 'How to Add a New Company', category: 'Company Management' },
    { title: 'Setting Up Payment Gateways', category: 'Integrations' },
    { title: 'Managing User Permissions', category: 'User & Permissions' },
    { title: 'Creating Database Backups', category: 'System Administration' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Documentation</h1>
        <p className="text-secondary-text mt-1">User guides and technical documentation</p>
      </div>

      {/* Search */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-text" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            />
          </div>
          <Button variant="primary">Search</Button>
        </div>
      </Card>

      {/* Popular Articles */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">Popular Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularArticles.map((article, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-accent hover:bg-primary-accent/5 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-text mb-1">{article.title}</h3>
                  <p className="text-xs text-secondary-text">{article.category}</p>
                </div>
                <IoDocumentText className="text-primary-accent flex-shrink-0 ml-2" size={20} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.id} className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-primary-text">{category.title}</h2>
                  <p className="text-sm text-secondary-text">{category.articles.length} articles</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.articles.map((article, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-accent hover:bg-primary-accent/5 transition-colors cursor-pointer"
                  >
                    <h3 className="font-semibold text-primary-text mb-2">{article.title}</h3>
                    <p className="text-sm text-secondary-text">{article.description}</p>
                    <Button variant="ghost" className="mt-3 text-sm p-0 h-auto">
                      Read More →
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Help Section */}
      <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-4">
          <IoHelpCircle className="text-blue-600 flex-shrink-0 mt-1" size={32} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary-text mb-2">Need More Help?</h3>
            <p className="text-sm text-secondary-text mb-4">
              Can't find what you're looking for? Contact our support team for assistance.
            </p>
            <div className="flex gap-3">
              <Button variant="primary">Contact Support</Button>
              <Button variant="outline">Submit Feedback</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Documentation

