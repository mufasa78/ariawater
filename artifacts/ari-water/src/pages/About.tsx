import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Heart, Users, Award, TrendingUp, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Droplets className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Aria Water</h1>
            <p className="text-xl text-blue-100">
              Delivering pure, refreshing water to homes and businesses across Kenya since 2020
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
          <div className="prose prose-lg mx-auto">
            <p className="text-gray-700 mb-4">
              Aria Water was founded with a simple mission: to provide clean, safe, and affordable 
              drinking water to every household in Kenya. What started as a small delivery service 
              has grown into one of the most trusted water brands in the region.
            </p>
            <p className="text-gray-700 mb-4">
              We understand that access to clean water is not just a convenience—it's a fundamental 
              human right. That's why we've invested in state-of-the-art purification technology and 
              built a reliable distribution network that ensures fresh water reaches you when you need it.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Heart className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Quality First</CardTitle>
                <CardDescription>
                  Every drop of water goes through rigorous testing and purification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  We use advanced filtration systems and regular quality checks to ensure 
                  you receive the purest water possible.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Customer Focus</CardTitle>
                <CardDescription>
                  Your satisfaction is our top priority
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  From easy ordering to timely delivery, we've designed every touchpoint 
                  around your needs and convenience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Reliability</CardTitle>
                <CardDescription>
                  Consistent service you can count on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Rain or shine, we're committed to delivering your water on time, 
                  every time, without compromise.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-blue-600 text-white rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">By The Numbers</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Bottles Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </div>

        {/* Our Process */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Water Purification Process</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <CardTitle>Source Selection</CardTitle>
                    <CardDescription>
                      We carefully select natural water sources from protected underground aquifers
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <CardTitle>Multi-Stage Filtration</CardTitle>
                    <CardDescription>
                      Advanced filtration removes impurities while retaining essential minerals
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <CardTitle>UV Treatment</CardTitle>
                    <CardDescription>
                      Ultraviolet sterilization eliminates bacteria and microorganisms
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <CardTitle>Quality Testing</CardTitle>
                    <CardDescription>
                      Every batch is tested in our certified laboratory before bottling
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    5
                  </div>
                  <div>
                    <CardTitle>Safe Packaging & Delivery</CardTitle>
                    <CardDescription>
                      Sealed in food-grade containers and delivered fresh to your door
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Certifications */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Certifications & Compliance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Award className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>ISO 22000 Certified</CardTitle>
                <CardDescription>
                  Food safety management system certification
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Award className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>KEBS Approved</CardTitle>
                <CardDescription>
                  Kenya Bureau of Standards quality certification
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Award className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>WHO Guidelines</CardTitle>
                <CardDescription>
                  Meets World Health Organization water quality standards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Award className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Regular Testing</CardTitle>
                <CardDescription>
                  Weekly laboratory tests by independent third-party auditors
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Experience Pure Water?</CardTitle>
              <CardDescription>
                Join thousands of satisfied customers who trust Aria Water for their daily needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/shop"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Order Now
                </a>
                <a
                  href="/magic-login"
                  className="border border-blue-600 text-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 transition-colors font-medium"
                >
                  Sign In
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
