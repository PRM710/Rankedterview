'use client';

import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                            RANKEDterview
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-lg font-medium border-2 border-teal-600 text-teal-600 hover:bg-teal-50 transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-6xl font-bold mb-6">
                        Master Interviews with{' '}
                        <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                            AI-Powered Feedback
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        Practice real-time mock interviews, receive instant AI evaluation,
                        and compete on global leaderboards.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center px-8 py-4 text-lg rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                        >
                            Start Practicing →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-20">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div className="text-4xl mb-4">🎥</div>
                        <h3 className="text-xl font-bold mb-2">Real-Time Interviews</h3>
                        <p className="text-gray-600">Practice with peers in live video interviews</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div className="text-4xl mb-4">🤖</div>
                        <h3 className="text-xl font-bold mb-2">AI Evaluation</h3>
                        <p className="text-gray-600">Get detailed feedback powered by GPT-4</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div className="text-4xl mb-4">🏆</div>
                        <h3 className="text-xl font-bold mb-2">Rankings</h3>
                        <p className="text-gray-600">Compete on global leaderboards</p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-teal-600 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2">10,000+</div>
                            <div className="text-teal-100">Interviews Completed</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">98%</div>
                            <div className="text-teal-100">User Satisfaction</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">4.8/5</div>
                            <div className="text-teal-100">Average Rating</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="bg-white rounded-xl shadow-lg p-12 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold mb-4">Ready to Start?</h2>
                    <p className="text-gray-600 mb-8">
                        Join thousands of users improving their interview skills
                    </p>
                    <Link
                        href="/login"
                        className="inline-block px-12 py-4 text-lg rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                    >
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="container mx-auto px-4 text-center">
                    <div className="text-2xl font-bold text-white mb-4">RANKEDterview</div>
                    <p className="mb-4">AI-Powered Interview Practice Platform</p>
                    <p className="text-sm">&copy; 2025 RANKEDterview. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
