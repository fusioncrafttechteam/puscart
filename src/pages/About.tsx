import React from 'react';
import { Link } from 'react-router-dom';
import {
  Apple,
  Beef,
  Clock,
  HeartHandshake,
  Leaf,
  MapPin,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Sprout,
  Truck,
  Users,
} from 'lucide-react';
import Footer from '../components/Footer';

const stats = [
  { icon: Clock, label: 'Delivery', value: '30 min', hint: 'To your doorstep' },
  { icon: Truck, label: 'Free shipping', value: '₹100+', hint: 'On qualifying orders' },
  { icon: ShieldCheck, label: 'Quality', value: '100%', hint: 'Freshness promise' },
  { icon: MapPin, label: 'Based in', value: 'Tiruvannamalai', hint: 'Tamil Nadu 606611' },
];

const offerings = [
  {
    icon: Apple,
    title: 'Fresh produce',
    description: 'Fruits, vegetables, and greens picked for the day.',
  },
  {
    icon: Beef,
    title: 'Meat & poultry',
    description: 'Quality meat, fish, and eggs for everyday cooking.',
  },
  {
    icon: ShoppingBasket,
    title: 'Daily groceries',
    description: 'Rice, millets, pulses, and pantry staples.',
  },
  {
    icon: Sparkles,
    title: 'Household care',
    description: 'Cleaning products and home essentials.',
  },
  {
    icon: Truck,
    title: '30-minute delivery',
    description: 'Fast local delivery when you need it most.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality guarantee',
    description: 'Carefully selected items, packed with care.',
  },
];

const reasons = [
  {
    icon: Clock,
    title: 'Shop from home',
    description: 'Browse the catalog on web or mobile and order in minutes.',
  },
  {
    icon: Sprout,
    title: 'Local-first sourcing',
    description: 'We work with nearby farmers and suppliers for fresher stock.',
  },
  {
    icon: HeartHandshake,
    title: 'Packed with care',
    description: 'Our team checks quality so groceries arrive in good condition.',
  },
];

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative bg-linear-to-br from-blue-700 via-blue-800 to-slate-950 text-white">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(147,197,253,0.25),transparent_55%)]" />

        <div className="relative mx-auto grid max-w-7xl items-start gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:gap-8 lg:px-8 lg:py-10">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100 uppercase">
              Puscart Delivery Service
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Fresh groceries, delivered in Tiruvannamalai
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Your neighbourhood grocery partner for fresh produce, daily essentials, and reliable
              doorstep delivery — without the queues.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-800 shadow-md hover:bg-blue-50"
              >
                Start shopping
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Contact us
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-3.5 sm:p-4"
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-lg font-bold sm:text-xl">{stat.value}</p>
                  <p className="mt-0.5 text-sm font-medium text-white">{stat.label}</p>
                  <p className="text-xs text-blue-100">{stat.hint}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="grid lg:grid-cols-2">
            <article className="border-b border-slate-100 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Our story</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Grocery runs should not take over your day. Puscart started as a neighbourhood delivery
                service so families in and around Tiruvannamalai can get everyday essentials without
                waiting in queues or compromising on freshness.
              </p>
            </article>

            <article className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Leaf className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Our mission</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                To deliver fresh, high-quality groceries quickly and reliably, while supporting local
                farmers and suppliers. Everyone deserves access to fresh food without the hassle of
                traditional grocery shopping.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">What we offer</h2>
              <p className="mt-2 max-w-xl text-slate-600">
                From farm-fresh produce to household staples, the catalog is built for daily cooking
                and home needs.
              </p>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              View catalog →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {offerings.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">Why choose Puscart?</h2>
            <p className="mt-2 text-slate-600">
              A simple order flow, careful packing, and a team that treats every delivery like it is
              going to a neighbour.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {reasons.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
                >
                  <span className="absolute right-4 top-4 text-4xl font-bold text-slate-100">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-3xl bg-blue-800 p-6 text-white sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-10">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
              <MapPin className="h-4 w-4" />
              Somasipadi, Tiruvannamalai
            </div>
            <h2 className="text-2xl font-bold">Ready for your next grocery run?</h2>
            <p className="mt-2 text-blue-100">
              No.391, Thindivanam Main Road, Opp. India One ATM, Somasipadi Post, Kilpennathur Taluk,
              Tiruvannamalai, Tamil Nadu 606611.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
            >
              Browse products
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
