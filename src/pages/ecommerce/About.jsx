import React from 'react'
import { MapPin, Phone, Mail, Clock, Shield, Award, Users } from 'lucide-react'
import { useAccessibility } from '../../context/AccessibilityContext'
import logo from '../../assets/BGMH.png'

const About = () => {
  const { speak } = useAccessibility()

  const values = [
    {
      icon: Shield,
      title: 'Quality First',
      description: 'We only stock products from trusted manufacturers and suppliers, ensuring every item meets our high standards.'
    },
    {
      icon: Award,
      title: 'Expert Advice',
      description: 'Our knowledgeable staff provides professional guidance to help you choose the right products for your projects.'
    },
    {
      icon: Users,
      title: 'Customer Focused',
      description: 'We prioritize customer satisfaction with personalized service and support for all your hardware needs.'
    }
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-6">

         <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-6">
            <img
              src={logo}
              alt="Batang Gapan Logo"
              className="w-full h-full object-cover"
            />
          </div>

          </div>
          <h1 className="text-4xl font-bold text-white mb-4">About Batang Gapan Mini Hardware</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Your trusted partner for quality hardware supplies since day one. 
            We provide reliable products and exceptional service to our community.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Batang Gapan Mini Hardware has been serving the community with dedication and integrity. 
                  We started with a simple mission: to provide high-quality hardware products at affordable prices 
                  while delivering exceptional customer service.
                </p>
                <p>
                  Over the years, we have grown to become a trusted name in the hardware industry, 
                  offering a comprehensive range of products including electrical supplies, plumbing materials, 
                  construction tools, safety equipment, and more.
                </p>
                <p>
                  Our commitment to quality and customer satisfaction has earned us the loyalty of countless 
                  customers who rely on us for their personal and professional projects.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-700">1000+</p>
                  <p className="text-sm text-gray-600 mt-1">Products Available</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-700">500+</p>
                  <p className="text-sm text-gray-600 mt-1">Happy Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-700">50+</p>
                  <p className="text-sm text-gray-600 mt-1">Product Categories</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-700">24/7</p>
                  <p className="text-sm text-gray-600 mt-1">Online Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
            <p className="text-gray-500 mt-2">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all text-center"
                onMouseEnter={() => speak(`${value.title}: ${value.description}`)}
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
            <p className="text-gray-500 mt-2">Get in touch with us for any inquiries</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
              <p className="text-sm text-gray-500">Batang Gapan, Nueva Ecija, Philippines</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
              <p className="text-sm text-gray-500">Contact us for details</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
              <p className="text-sm text-gray-500">cyruscabanes@gmail.com</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Hours</h3>
              <p className="text-sm text-gray-500">Mon-Sat: 8AM - 6PM</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
